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

/**
 * Manages job/internship applications (candidatures): per-student CRUD, the
 * admin cross-user read scoped by promo, bulk CSV import, and firing admin
 * notifications when an application reaches a noteworthy outcome.
 */
@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly promoAccess: PromoAccessService,
  ) {}

  /**
   * Creates an application owned by the given user.
   *
   * @param createApplicationDto - Validated application fields.
   * @param userId - Owner of the new application.
   * @returns The created {@link Application}.
   */
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

  /**
   * Lists the caller's own applications, oldest first.
   *
   * @param userId - Owner of the applications.
   * @returns The user's applications ordered by `created_at` ascending.
   */
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
   *
   * @param targetUserId - Student whose applications are being read.
   * @param requester - The calling admin (id + role) for promo scoping.
   * @throws NotFoundException When the target user does not exist.
   * @throws ForbiddenException When the requester doesn't administer the promo.
   * @returns The target user's applications.
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

  /**
   * Fetches a single application by id, scoped to its owner.
   *
   * @param id - Application id.
   * @param userId - Owner id (enforces isolation).
   * @returns The matching application, or `null` if none.
   */
  findOne(id: number, userId: number) {
    return this.prisma.application.findFirst({
      where: {
        id: id,
        userId: userId,
      },
    });
  }

  /**
   * Updates an owned application. When the new outcome is ENTRETIEN or DECROCHEE,
   * fans out notifications to all admins concurrently (db-11) so a slow send
   * doesn't block the response.
   *
   * @param id - Application id to update.
   * @param updateApplicationDto - Partial application fields to persist.
   * @param userId - Owner id (scopes the update).
   * @throws NotFoundException When no owned application matches `id`.
   * @returns The updated application.
   */
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

  /**
   * Deletes an owned application.
   *
   * @param id - Application id to delete.
   * @param userId - Owner id (scopes the delete).
   * @throws NotFoundException When no owned application matches `id`.
   * @returns `{ id }` of the deleted application.
   */
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

  /**
   * Bulk-imports applications for one user from a CSV buffer. Strips the BOM,
   * maps localized headers, sanitizes every cell against formula injection,
   * coerces status/outcome/date values, and inserts in batches. Malformed rows
   * are skipped and reported; a systemic DB failure aborts the whole import.
   *
   * @param buffer - Raw uploaded CSV bytes (UTF-8, optional BOM).
   * @param userId - Owner the imported applications are attached to.
   * @throws BadRequestException When the CSV is invalid or exceeds the row cap.
   * @throws InternalServerErrorException When the batch insert fails.
   * @returns Counts of imported/skipped rows plus per-row error details.
   */
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

    //CSV max rows = 2000, declared in the mapper
    if (rows.length > MAX_CSV_ROWS) {
      throw new BadRequestException(
        `Le fichier contient ${rows.length} lignes. Maximum autorisé : ${MAX_CSV_ROWS}`,
      );
    }

    // Normalize each column on the same format
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

      // If the column "entreprise" is empty, then skip it
      if (!data.entreprise) {
        result.skipped++;
        result.errors.push({
          row: rowNum,
          message: 'Colonne "entreprise" absente ou vide',
        });
        continue;
      }

      // Errors checks if status or outcome if not recognized
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

      // Validation of each rows with a security applied : checks chars
      // Injection is not possible
      // sanitizeCsvCell is in mapper
      validRows.push({
        entreprise: sanitizeCsvCell(data.entreprise),
        lien: data.lien ? sanitizeCsvCell(data.lien) : null,
        commentaire: data.commentaire
          ? sanitizeCsvCell(data.commentaire)
          : null,
        //mapStatut checks if the status match with one of declared in mapper
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
        //mapOutcome checks if the status match with one of declared in mapper
        outcome: data.outcome
          ? (mapOutcome(data.outcome) ?? undefined)
          : undefined,
        userId,
      });
    }

    try {
      for (let i = 0; i < validRows.length; i += CSV_BATCH_SIZE) {
        const batch = validRows.slice(i, i + CSV_BATCH_SIZE);
        const res = await this.prisma.application.createMany({ data: batch });
        result.imported += res.count;
      }
    } catch (err) {
      this.logger.error("Erreur systémique lors de l'import CSV", err);
      throw new InternalServerErrorException(
        "Erreur lors de l'import en base de données",
      );
    }

    return result;
  }
}
