import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsService } from './documents.service';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from '../minio/minio.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotFoundException } from '@nestjs/common';
import { NotifType } from '../../prisma/generated/prisma/client';

const mockPrisma = {
  document: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    delete: jest.fn(),
  },
};

const mockMinioService = {
  uploadFile: jest.fn(),
  getPresignedUrl: jest.fn(),
  deleteFile: jest.fn(),
};

const mockNotificationsService = {
  createAndEmit: jest.fn(),
};

describe('DocumentsService', () => {
  let service: DocumentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MinioService, useValue: mockMinioService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('upload', () => {
    it('sanitise le nom, uploade sur MinIO et émet une notification DOCUMENT_ADDED', async () => {
      const file = {
        originalname: 'mon <fichier>.pdf',
        buffer: Buffer.from('data'),
        size: 4,
        mimetype: 'application/pdf',
      };
      mockMinioService.uploadFile.mockResolvedValue(undefined);
      mockPrisma.document.create.mockResolvedValue({ id: 1 });
      mockNotificationsService.createAndEmit.mockResolvedValue({});

      await service.upload(file as any, undefined, 42);

      expect(mockPrisma.document.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'mon _fichier_.pdf',
          }),
        }),
      );

      expect(mockMinioService.uploadFile).toHaveBeenCalledWith(
        expect.stringMatching(/^42\/\d+-[0-9a-f-]+\.pdf$/),
        file.buffer,
        file.size,
        file.mimetype,
      );

      expect(mockNotificationsService.createAndEmit).toHaveBeenCalledWith(
        42,
        NotifType.DOCUMENT_ADDED,
        expect.any(Object),
      );
    });
  });

  describe('getDownloadUrl', () => {
    it('lève NotFoundException si le document est introuvable', async () => {
      mockPrisma.document.findFirst.mockResolvedValue(null);

      await expect(service.getDownloadUrl(99, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('appelle getPresignedUrl avec storageKey et TTL 3600 et retourne { url }', async () => {
      mockPrisma.document.findFirst.mockResolvedValue({
        id: 1,
        storageKey: 'key/file.pdf',
      });
      mockMinioService.getPresignedUrl.mockResolvedValue('https://minio/url');

      const result = await service.getDownloadUrl(1, 5);

      expect(mockMinioService.getPresignedUrl).toHaveBeenCalledWith(
        'key/file.pdf',
        3600,
      );
      expect(result).toEqual({ url: 'https://minio/url' });
    });

    it('filtre par userId si userId est fourni', async () => {
      mockPrisma.document.findFirst.mockResolvedValue({
        storageKey: 'k',
      });
      mockMinioService.getPresignedUrl.mockResolvedValue('url');

      await service.getDownloadUrl(1, 5);

      expect(mockPrisma.document.findFirst).toHaveBeenCalledWith({
        where: { id: 1, userId: 5 },
      });
    });

    it('ne filtre pas par userId si userId est undefined', async () => {
      mockPrisma.document.findFirst.mockResolvedValue({
        storageKey: 'k',
      });
      mockMinioService.getPresignedUrl.mockResolvedValue('url');

      await service.getDownloadUrl(1, undefined);

      expect(mockPrisma.document.findFirst).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('remove', () => {
    it('lève NotFoundException si le document est introuvable', async () => {
      mockPrisma.document.findFirst.mockResolvedValue(null);

      await expect(service.remove(99, 1)).rejects.toThrow(NotFoundException);
    });

    it('supprime le fichier sur MinIO puis le document en DB', async () => {
      mockPrisma.document.findFirst.mockResolvedValue({
        id: 1,
        storageKey: '1/file.pdf',
        userId: 5,
      });
      mockMinioService.deleteFile.mockResolvedValue(undefined);
      mockPrisma.document.delete.mockResolvedValue({ id: 1 });

      await service.remove(1, 5);

      expect(mockMinioService.deleteFile).toHaveBeenCalledWith('1/file.pdf');
      expect(mockPrisma.document.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });
});
