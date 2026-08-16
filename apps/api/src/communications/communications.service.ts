import { Injectable } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';
import { CreateCommunicationDto } from './dto/create-communication.dto';
import { PrismaService } from '../prisma/prisma.service';
import {
  CommunicationType,
  Prisma,
} from '../../prisma/generated/prisma/client';

/**
 * Records the log of admin→student communications (emails and RE feedback) so
 * they can be reviewed later. Message bodies are sanitized on write because they
 * are rendered with `dangerouslySetInnerHTML` in the admin UI (stored-XSS
 * defense).
 */
@Injectable()
export class CommunicationsService {
  constructor(private readonly prismaService: PrismaService) {}
  /**
   * Persists a communication entry, sanitizing the HTML body before storage.
   *
   * @param dto - Sender, recipient, type, and optional subject/body/score.
   * @returns The created communication row.
   */
  async create(dto: CreateCommunicationDto) {
    const comm = await this.prismaService.communication.create({
      data: {
        senderId: dto.senderId,
        recipientId: dto.recipientId,
        type: dto.type,
        subject: dto.subject,
        // Sanitize on write: the body is later rendered with
        // dangerouslySetInnerHTML in the admin UI, so neutralize any
        // script/onerror/etc. before it is ever persisted (stored-XSS defense).
        body: dto.body ? sanitizeHtml(dto.body) : dto.body,
        score: dto.score,
      },
    });

    return comm;
  }

  /**
   * Lists communications, optionally filtered by a participant and/or type, with
   * sender and recipient profiles included, newest first.
   *
   * @param userId - Optional user id; matches as either sender or recipient.
   * @param type - Optional communication type filter (EMAIL, FEEDBACK).
   * @returns The matching communications with participant info.
   */
  async findAll(userId?: number, type?: CommunicationType) {
    const where: Prisma.CommunicationWhereInput = {};

    if (userId !== undefined) {
      where.OR = [{ senderId: userId }, { recipientId: userId }];
    }

    if (type !== undefined) {
      where.type = type;
    }

    return await this.prismaService.communication.findMany({
      where: where,
      include: {
        sender: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
        recipient: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }
}
