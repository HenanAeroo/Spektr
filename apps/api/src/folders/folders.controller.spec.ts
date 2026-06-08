import { Test, TestingModule } from '@nestjs/testing';
import { FoldersController } from './folders.controller';
import { FoldersService } from './folders.service';

const mockFoldersService = {
  create: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('FoldersController', () => {
  let controller: FoldersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FoldersController],
      providers: [{ provide: FoldersService, useValue: mockFoldersService }],
    }).compile();

    controller = module.get<FoldersController>(FoldersController);
  });

  afterEach(() => jest.clearAllMocks());

  const user = { id: 1 } as any;

  describe('create', () => {
    it('delegates to foldersService.create with dto and user.id', async () => {
      const dto = { name: 'Docs' } as any;
      mockFoldersService.create.mockResolvedValue({ id: 1 });

      await controller.create(dto, user);

      expect(mockFoldersService.create).toHaveBeenCalledWith(dto, user.id);
    });
  });

  describe('findAll', () => {
    it('delegates to foldersService.findAll with user.id', async () => {
      mockFoldersService.findAll.mockResolvedValue([]);

      await controller.findAll(user);

      expect(mockFoldersService.findAll).toHaveBeenCalledWith(user.id);
    });
  });

  describe('update', () => {
    it('delegates to foldersService.update with id, dto and user.id', async () => {
      const dto = { name: 'Updated' } as any;
      mockFoldersService.update.mockResolvedValue({ count: 1 });

      await controller.update(3, dto, user);

      expect(mockFoldersService.update).toHaveBeenCalledWith(3, dto, user.id);
    });
  });

  describe('remove', () => {
    it('delegates to foldersService.remove with id and user.id', async () => {
      mockFoldersService.remove.mockResolvedValue({ count: 1 });

      await controller.remove(3, user);

      expect(mockFoldersService.remove).toHaveBeenCalledWith(3, user.id);
    });
  });
});
