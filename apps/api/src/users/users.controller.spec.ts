import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CommunicationsService } from '../communications/communications.service';
import { PromoAccessService } from '../promos/promo-access.service';
import { Role } from '../../prisma/generated/prisma/client';

const mockUsersService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  changePassword: jest.fn(),
  bulkEmail: jest.fn(),
};

const mockNotificationsService = {
  sendPasswordChangedEmail: jest.fn(),
  sendFeedbackEmail: jest.fn(),
};

const mockCommunicationsService = {
  create: jest.fn().mockResolvedValue({}),
};

const mockPromoAccess = {
  administeredPromoIds: jest.fn().mockResolvedValue([]),
  administersPromo: jest.fn().mockResolvedValue(true),
  assertAdministersPromo: jest.fn().mockResolvedValue(undefined),
};

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: CommunicationsService, useValue: mockCommunicationsService },
        { provide: PromoAccessService, useValue: mockPromoAccess },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  afterEach(() => jest.clearAllMocks());

  const adminUser = { id: 1, role: Role.ADMIN } as any;
  const studentUser = { id: 2, role: Role.STUDENT } as any;

  describe('findAll', () => {
    it('delegates to usersService.findAll with default page=1 and limit=9', async () => {
      mockUsersService.findAll.mockResolvedValue({
        data: [],
        total: 0,
        hasNextPage: false,
      });

      await controller.findAll('1', '9', undefined, adminUser);

      expect(mockUsersService.findAll).toHaveBeenCalledWith(
        1,
        9,
        undefined,
        adminUser.id,
        adminUser.role,
      );
    });

    it('parses string args to integers before delegating', async () => {
      mockUsersService.findAll.mockResolvedValue({
        data: [],
        total: 0,
        hasNextPage: false,
      });

      await controller.findAll('2', '5', undefined, adminUser);

      expect(mockUsersService.findAll).toHaveBeenCalledWith(
        2,
        5,
        undefined,
        adminUser.id,
        adminUser.role,
      );
    });
  });

  describe('me', () => {
    it('returns the current user directly without calling the service', () => {
      const result = controller.me(studentUser);

      expect(result).toBe(studentUser);
      expect(mockUsersService.findOne).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('admin can request any user id', async () => {
      mockUsersService.findOne.mockResolvedValue({ id: 5 });

      await controller.findOne(5, adminUser);

      expect(mockUsersService.findOne).toHaveBeenCalledWith({ id: 5 });
    });

    it('non-admin can request their own id', async () => {
      mockUsersService.findOne.mockResolvedValue({ id: 2 });

      await controller.findOne(2, studentUser);

      expect(mockUsersService.findOne).toHaveBeenCalledWith({ id: 2 });
    });

    it('non-admin requesting a different id throws ForbiddenException', async () => {
      await expect(controller.findOne(5, studentUser)).rejects.toThrow(
        ForbiddenException,
      );

      expect(mockUsersService.findOne).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('delegates to usersService.update when user.id matches id', async () => {
      const dto = { first_name: 'Jane' } as any;
      mockUsersService.update.mockResolvedValue({ id: 2 });

      await controller.update(2, dto, studentUser);

      expect(mockUsersService.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: dto,
      });
    });

    it('throws ForbiddenException when user.id !== id', () => {
      expect(() => controller.update(5, {} as any, studentUser)).toThrow(
        ForbiddenException,
      );

      expect(mockUsersService.update).not.toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    it('calls usersService.changePassword then sendPasswordChangedEmail and returns the result', async () => {
      const body = { oldPassword: 'old', newPassword: 'new' } as any;
      mockUsersService.changePassword.mockResolvedValue({ success: true });
      mockNotificationsService.sendPasswordChangedEmail.mockResolvedValue(
        undefined,
      );

      const result = await controller.changePassword(body, studentUser);

      expect(mockUsersService.changePassword).toHaveBeenCalledWith(
        studentUser.id,
        'old',
        'new',
      );
      expect(
        mockNotificationsService.sendPasswordChangedEmail,
      ).toHaveBeenCalledWith(studentUser.id);
      expect(result).toEqual({ success: true });
    });
  });

  describe('bulkEmail', () => {
    it('delegates to usersService.bulkEmail with the dto', async () => {
      const dto = { userIds: [1, 2], subject: 'Objet', body: 'Bonjour' } as any;
      mockUsersService.bulkEmail.mockResolvedValue(undefined);

      await controller.bulkEmail(dto, adminUser);

      expect(mockUsersService.bulkEmail).toHaveBeenCalledWith(dto, adminUser);
    });
  });

  describe('sendFeedback', () => {
    it('calls notificationsService.sendFeedbackEmail and returns { sent: true }', async () => {
      mockUsersService.findOne.mockResolvedValue({ id: 5, promoId: 1 });
      mockNotificationsService.sendFeedbackEmail.mockResolvedValue(undefined);

      const result = await controller.sendFeedback(
        5,
        {
          score: 4,
          comment: 'Bien',
        },
        adminUser,
      );

      expect(mockNotificationsService.sendFeedbackEmail).toHaveBeenCalledWith(
        5,
        4,
        'Bien',
      );
      expect(result).toEqual({ sent: true });
    });
  });

  describe('remove', () => {
    it('delegates to usersService.remove when user.id matches id', async () => {
      mockUsersService.remove.mockResolvedValue({ id: 2 });

      await controller.remove(2, studentUser);

      expect(mockUsersService.remove).toHaveBeenCalledWith(
        { id: 2 },
        studentUser.id,
        studentUser.role,
      );
    });

    it('throws ForbiddenException when user.id !== id', () => {
      expect(() => controller.remove(5, studentUser)).toThrow(
        ForbiddenException,
      );

      expect(mockUsersService.remove).not.toHaveBeenCalled();
    });
  });
});
