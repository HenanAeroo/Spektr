import { Test, TestingModule } from '@nestjs/testing';
import { FoldersService } from './folders.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  folder: {
    create: jest.fn(),
    findMany: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  },
};

describe('FoldersService', () => {
  let service: FoldersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FoldersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<FoldersService>(FoldersService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('appelle folder.create avec les champs du dto et connecte l\'user', async () => {
      const dto = { name: 'Candidatures' };
      mockPrisma.folder.create.mockResolvedValue({ id: 1, ...dto });

      await service.create(dto as any, 7);

      expect(mockPrisma.folder.create).toHaveBeenCalledWith({
        data: {
          ...dto,
          user: { connect: { id: 7 } },
        },
      });
    });
  });

  describe('findAll', () => {
    it('appelle folder.findMany avec le filtre userId', async () => {
      mockPrisma.folder.findMany.mockResolvedValue([]);

      await service.findAll(7);

      expect(mockPrisma.folder.findMany).toHaveBeenCalledWith({
        where: { userId: 7 },
      });
    });
  });

  describe('update', () => {
    it('appelle folder.updateMany avec where id+userId et data dto', async () => {
      const dto = { name: 'Updated' };
      mockPrisma.folder.updateMany.mockResolvedValue({ count: 1 });

      await service.update(3, dto as any, 7);

      expect(mockPrisma.folder.updateMany).toHaveBeenCalledWith({
        where: { id: 3, userId: 7 },
        data: dto,
      });
    });
  });

  describe('remove', () => {
    it('appelle folder.deleteMany avec where id+userId', async () => {
      mockPrisma.folder.deleteMany.mockResolvedValue({ count: 1 });

      await service.remove(3, 7);

      expect(mockPrisma.folder.deleteMany).toHaveBeenCalledWith({
        where: { id: 3, userId: 7 },
      });
    });
  });
});
