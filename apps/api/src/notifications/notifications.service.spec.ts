import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { MailService } from '../mail/mail.service';
import { NotifType } from '../../prisma/generated/prisma/client';

const mockEmit = jest.fn();
const mockTo = jest.fn().mockReturnValue({ emit: mockEmit });

const mockPrisma = {
  notification: {
    create: jest.fn(),
    findMany: jest.fn(),
    updateMany: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
};

const mockEventsGateway = {
  server: { to: mockTo },
};

const mockMailService = {
  send: jest.fn(),
};

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventsGateway, useValue: mockEventsGateway },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('createAndEmit', () => {
    const notif = { id: 1, userId: 5, type: NotifType.DOCUMENT_ADDED };

    it('crée la notification en DB et émet via WebSocket', async () => {
      mockPrisma.notification.create.mockResolvedValue(notif);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 5, email: null });

      await service.createAndEmit(5, NotifType.DOCUMENT_ADDED, {});

      expect(mockPrisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 5, type: NotifType.DOCUMENT_ADDED }),
        }),
      );
      expect(mockTo).toHaveBeenCalledWith('user:5');
      expect(mockEmit).toHaveBeenCalledWith('notification', notif);
    });

    it('envoie un email si l\'user a une adresse email', async () => {
      mockPrisma.notification.create.mockResolvedValue(notif);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 5,
        email: 'user@example.com',
        first_name: 'John',
      });
      mockMailService.send.mockResolvedValue(undefined);

      await service.createAndEmit(5, NotifType.DOCUMENT_ADDED, {});

      expect(mockMailService.send).toHaveBeenCalledTimes(1);
    });

    it('n\'envoie pas d\'email si l\'user n\'a pas d\'adresse email', async () => {
      mockPrisma.notification.create.mockResolvedValue(notif);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 5, email: null });

      await service.createAndEmit(5, NotifType.DOCUMENT_ADDED, {});

      expect(mockMailService.send).not.toHaveBeenCalled();
    });
  });

  describe('sendFeedbackEmail', () => {
    it('ne fait rien si l\'étudiant est introuvable', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await service.sendFeedbackEmail(99, 2, 'Bon travail');

      expect(mockMailService.send).not.toHaveBeenCalled();
    });

    it('envoie l\'email au student si l\'user existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 3,
        email: 'student@example.com',
        first_name: 'Alice',
      });
      mockMailService.send.mockResolvedValue(undefined);

      await service.sendFeedbackEmail(3, 1, 'Bien');

      expect(mockMailService.send).toHaveBeenCalledWith(
        'student@example.com',
        expect.any(String),
        expect.any(String),
      );
    });
  });

  describe('sendPasswordChangedEmail', () => {
    it('ne fait rien si l\'user est introuvable', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await service.sendPasswordChangedEmail(99);

      expect(mockMailService.send).not.toHaveBeenCalled();
    });

    it('ne fait rien si l\'user n\'a pas d\'email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, email: null });

      await service.sendPasswordChangedEmail(1);

      expect(mockMailService.send).not.toHaveBeenCalled();
    });

    it('envoie l\'email de confirmation si l\'user a un email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'user@example.com',
        first_name: 'Bob',
      });
      mockMailService.send.mockResolvedValue(undefined);

      await service.sendPasswordChangedEmail(1);

      expect(mockMailService.send).toHaveBeenCalledWith(
        'user@example.com',
        expect.any(String),
        expect.any(String),
      );
    });
  });

  describe('markAsRead', () => {
    it('appelle notification.updateMany avec where id+userId et data read: true', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 1 });

      await service.markAsRead(7, 3);

      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { id: 7, userId: 3 },
        data: { read: true },
      });
    });
  });

  describe('markAllRead', () => {
    it('appelle notification.updateMany avec where userId et data read: true', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 5 });

      await service.markAllRead(3);

      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 3 },
        data: { read: true },
      });
    });
  });
});
