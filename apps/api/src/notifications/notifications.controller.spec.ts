import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

const mockNotificationsService = {
  findAllForUser: jest.fn(),
  markAllRead: jest.fn(),
  markAsRead: jest.fn(),
};

describe('NotificationsController', () => {
  let controller: NotificationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  afterEach(() => jest.clearAllMocks());

  const user = { id: 1 } as any;

  describe('findAll', () => {
    it('délègue à notificationsService.findAllForUser avec user.id', async () => {
      mockNotificationsService.findAllForUser.mockResolvedValue([]);

      await controller.findAll(user);

      expect(mockNotificationsService.findAllForUser).toHaveBeenCalledWith(
        user.id,
      );
    });
  });

  describe('markAllread', () => {
    it('délègue à notificationsService.markAllRead avec user.id', async () => {
      mockNotificationsService.markAllRead.mockResolvedValue({ count: 3 });

      await controller.markAllread(user);

      expect(mockNotificationsService.markAllRead).toHaveBeenCalledWith(
        user.id,
      );
    });
  });

  describe('update (markAsRead)', () => {
    it('délègue à notificationsService.markAsRead avec id et user.id', async () => {
      mockNotificationsService.markAsRead.mockResolvedValue({ count: 1 });

      await controller.update(7, user);

      expect(mockNotificationsService.markAsRead).toHaveBeenCalledWith(
        7,
        user.id,
      );
    });
  });
});
