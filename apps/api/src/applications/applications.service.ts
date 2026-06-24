import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as Papa from 'papaparse';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotifType,
  Outcome,
  type Application,
} from '../../prisma/generated/prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PromoAccessService, Requester } from '../promos/promo-access.service';
import { ADMIN_ROLES } from '../auth/roles';
import {
  ApplicationCsvRow,
  ApplicationField,
  COLUMN_MAP,
  CSV_BATCH_SIZE,
  ImportResult,
  MAX_CSV_ROWS,
  mapOutcome,
  mapStatut,
  normalizeKey,
  parseDate,
  sanitizeCsvCell,
} from './applications.csv-mapper';

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly promoAccess: PromoAccessService,
  ) {}

  create(
    createApplicationDto: CreateApplicationDto,
    userId: number,
  ): Promise<Application> {
    return this.prisma.application.create({
      data: {
        entreprise: createApplicationDto.entreprise,
        lien: createApplicationDto.lien,
        commentaire: createApplicationDto.commentaire,
        statut: createApplicationDto.statut,
        contact_nom: createApplicationDto.contact_nom,
        contact_email: createApplicationDto.contact_email,
        contact_tel: createApplicationDto.contact_tel,
        date_candidature: createApplicationDto.date_candidature,
        date_relance_tel: createApplicationDto.date_relance_tel,
        date_relance_contact: createApplicationDto.date_relance_contact,
        date_reponse_entreprise: createApplicationDto.date_reponse_entreprise,
        outcome: createApplicationDto.outcome,
        user: { connect: { id: userId } },
      },
    });
  }

  findMyApplications(userId: number) {
    return this.prisma.application.findMany({
      where: {
        userId: userId,
      },
      orderBy: { created_at: 'asc' },
    });
  }

  /**
   * Admin view of another user's applications — scoped to promos the requester
   * administers (AC-10). SUPER_ADMIN bypasses.
   */
  async findForUser(targetUserId: number, requester: Requester) {
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { promoId: true },
    });
    if (!target) throw new NotFoundException();
    await this.promoAccess.assertAdministersPromo(requester, target.promoId);
    return this.findMyApplications(targetUserId);
  }

  findOne(id: number, userId: number) {
    return this.prisma.application.findFirst({
      where: {
        id: id,
        userId: userId,
      },
    });
  }

  async update(
    id: number,
    updateApplicationDto: UpdateApplicationDto,
    userId: number,
  ) {
    // Ownership-scoped update; count===0 means no row matched (wrong or foreign
    // id) — surface it as a 404 instead of a silent {count:0} no-op the
    // optimistic client never reconciles.
    const { count } = await this.prisma.application.updateMany({
      where: {
        id: id,
        userId: userId,
      },
      data: {
        entreprise: updateApplicationDto.entreprise,
        lien: updateApplicationDto.lien,
        commentaire: updateApplicationDto.commentaire,
        statut: updateApplicationDto.statut,
        contact_nom: updateApplicationDto.contact_nom,
        contact_email: updateApplicationDto.contact_email,
        contact_tel: updateApplicationDto.contact_tel,
        date_candidature: updateApplicationDto.date_candidature,
        date_relance_tel: updateApplicationDto.date_relance_tel,
        date_relance_contact: updateApplicationDto.date_relance_contact,
        date_reponse_entreprise: updateApplicationDto.date_reponse_entreprise,
        outcome: updateApplicationDto.outcome,
      },
    });

    if (count === 0) throw new NotFoundException('Candidature introuvable');

    if (
      updateApplicationDto.outcome === Outcome.ENTRETIEN ||
      updateApplicationDto.outcome === Outcome.DECROCHEE
    ) {
      const admins = await this.prisma.user.findMany({
        where: { role: { in: [...ADMIN_ROLES] } },
        select: { id: true },
      });
      // Fan out notifications concurrently (db-11) — one slow SMTP send no
      // longer blocks the rest, and one failure doesn't abort the others.
      await Promise.allSettled(
        admins.map((admin) =>
          this.notificationsService.createAndEmit(
            admin.id,
            NotifType.APPLICATION_STATUS,
            { studentId: userId, outcome: updateApplicationDto.outcome },
          ),
        ),
      );
    }

    return this.prisma.application.findFirst({
      where: { id: id, userId: userId },
    });
  }

  async remove(id: number, userId: number) {
    const { count } = await this.prisma.application.deleteMany({
      where: {
        id: id,
        userId: userId,
      },
    });

    if (count === 0) throw new NotFoundException('Candidature introuvable');

    return { id };
  }

  async importFromCsv(buffer: Buffer, userId: number): Promise<ImportResult> {
    // Strip the UTF-8 BOM (U+FEFF) that Excel-exported CSVs often prepend.
    const raw = buffer.toString('utf-8');
    const csv = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;

    const { data: rows, errors: parseErrors } = Papa.parse<
      Record<string, string>
    >(csv, { header: true, skipEmptyLines: true });

    if (parseErrors.length > 0 && rows.length === 0) {
      throw new BadRequestException('Fichier CSV invalide');
    }
    if (rows.length === 0) return { imported: 0, skipped: 0, errors: [] };

    // Fix #4: cap row count to prevent DoS
    if (rows.length > MAX_CSV_ROWS) {
      throw new BadRequestException(
        `Le fichier contient ${rows.length} lignes. Maximum autorisé : ${MAX_CSV_ROWS}`,
      );
    }

    const colMap = new Map<string, ApplicationField>();
    for (const header of Object.keys(rows[0])) {
      const field = COLUMN_MAP[normalizeKey(header)];
      if (field) colMap.set(header, field);
    }

    const result: ImportResult = { imported: 0, skipped: 0, errors: [] };
    const validRows: ApplicationCsvRow[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      const data: Partial<Record<ApplicationField, string>> = {};
      for (const [csvCol, dbField] of colMap.entries()) {
        const raw = row[csvCol]?.trim();
        if (raw) data[dbField] = raw;
      }

      if (!data.entreprise) {
        result.skipped++;
        result.errors.push({
          row: rowNum,
          message: 'Colonne "entreprise" absente ou vide',
        });
        continue;
      }

      // Fix #10: warn on unrecognized enum values (don't silently discard)
      if (data.statut && mapStatut(data.statut) === undefined) {
        result.errors.push({
          row: rowNum,
          message: `Statut "${data.statut}" non reconnu, valeur ignorée`,
        });
      }
      if (data.outcome && mapOutcome(data.outcome) === undefined) {
        result.errors.push({
          row: rowNum,
          message: `Outcome "${data.outcome}" non reconnu, valeur ignorée`,
        });
      }

      validRows.push({
        entreprise: sanitizeCsvCell(data.entreprise),
        lien: data.lien ? sanitizeCsvCell(data.lien) : null,
        commentaire: data.commentaire
          ? sanitizeCsvCell(data.commentaire)
          : null,
        // Fix #5: use undefined (not null) so Prisma applies @default(A_CONTACTER)
        statut: data.statut ? mapStatut(data.statut) : undefined,
        contact_nom: data.contact_nom
          ? sanitizeCsvCell(data.contact_nom)
          : null,
        contact_email: data.contact_email ?? null,
        contact_tel: data.contact_tel ?? null,
        date_candidature: data.date_candidature
          ? parseDate(data.date_candidature)
          : null,
        date_relance_contact: data.date_relance_contact
          ? parseDate(data.date_relance_contact)
          : null,
        date_relance_tel: data.date_relance_tel
          ? parseDate(data.date_relance_tel)
          : null,
        date_reponse_entreprise: data.date_reponse_entreprise
          ? parseDate(data.date_reponse_entreprise)
          : null,
        // Fix #5: use undefined so @default(RAPPEL) applies when no outcome
        outcome: data.outcome
          ? (mapOutcome(data.outcome) ?? undefined)
          : undefined,
        userId,
      });
    }

    // Fix #4: batch inserts instead of N sequential creates
    try {
      for (let i = 0; i < validRows.length; i += CSV_BATCH_SIZE) {
        const batch = validRows.slice(i, i + CSV_BATCH_SIZE);
        const res = await this.prisma.application.createMany({ data: batch });
        result.imported += res.count;
      }
    } catch (err) {
      // Fix #7: distinguish systemic errors (infra/FK) from row-level errors
      this.logger.error("Erreur systémique lors de l'import CSV", err);
      throw new InternalServerErrorException(
        "Erreur lors de l'import en base de données",
      );
    }

    return result;
  }
}
