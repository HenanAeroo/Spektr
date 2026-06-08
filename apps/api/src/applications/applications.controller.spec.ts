import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';

const mockApplicationsService = {
  create: jest.fn(),
  findMyApplications: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('ApplicationsController', () => {
  let controller: ApplicationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApplicationsController],
      providers: [
        { provide: ApplicationsService, useValue: mockApplicationsService },
      ],
    }).compile();

    controller = module.get<ApplicationsController>(ApplicationsController);
  });

  afterEach(() => jest.clearAllMocks());

  const user = { id: 1, role: 'STUDENT' } as any;

  describe('create', () => {
    it('délègue à applicationsService.create avec dto et user.id', async () => {
      const dto = { entreprise: 'Acme' } as any;
      mockApplicationsService.create.mockResolvedValue({ id: 1 });

      await controller.create(dto, user);

      expect(mockApplicationsService.create).toHaveBeenCalledWith(dto, user.id);
    });
  });

  describe('findMyApplications', () => {
    it('délègue à applicationsService.findMyApplications avec user.id', async () => {
      mockApplicationsService.findMyApplications.mockResolvedValue([]);

      await controller.findMyApplications(user);

      expect(mockApplicationsService.findMyApplications).toHaveBeenCalledWith(
        user.id,
      );
    });
  });

  describe('update', () => {
    it('délègue à applicationsService.update avec id, dto et user.id', async () => {
      const dto = { statut: 'RELANCE' } as any;
      mockApplicationsService.update.mockResolvedValue({ count: 1 });

      await controller.update(5, dto, user);

      expect(mockApplicationsService.update).toHaveBeenCalledWith(
        5,
        dto,
        user.id,
      );
    });
  });

  describe('remove', () => {
    it('délègue à applicationsService.remove avec id et user.id', async () => {
      mockApplicationsService.remove.mockResolvedValue({ count: 1 });

      await controller.remove(3, user);

      expect(mockApplicationsService.remove).toHaveBeenCalledWith(3, user.id);
    });
  });
});
