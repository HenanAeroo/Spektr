import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

const mockDocumentsService = {
  upload: jest.fn(),
  findAll: jest.fn(),
  findForUser: jest.fn(),
  getDownloadUrl: jest.fn(),
  remove: jest.fn(),
  review: jest.fn(),
  getPendingReviews: jest.fn(),
};

describe('DocumentsController', () => {
  let controller: DocumentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [
        { provide: DocumentsService, useValue: mockDocumentsService },
      ],
    }).compile();

    controller = module.get<DocumentsController>(DocumentsController);
  });

  afterEach(() => jest.clearAllMocks());

  const student = { id: 1, role: 'STUDENT' } as any;
  const admin = { id: 2, role: 'ADMIN' } as any;

  describe('uploadFile', () => {
    it('delegates to documentsService.upload with file, folderId and user.id', async () => {
      const file = { originalname: 'cv.pdf' } as any;
      mockDocumentsService.upload.mockResolvedValue({ id: 1 });

      await controller.uploadFile(file, '3', undefined, student);

      expect(mockDocumentsService.upload).toHaveBeenCalledWith(
        file,
        3,
        student.id,
        undefined,
      );
    });

    it('passes folderId as undefined if absent', async () => {
      const file = { originalname: 'cv.pdf' } as any;
      mockDocumentsService.upload.mockResolvedValue({ id: 1 });

      await controller.uploadFile(file, undefined, undefined, student);

      expect(mockDocumentsService.upload).toHaveBeenCalledWith(
        file,
        undefined,
        student.id,
        undefined,
      );
    });
  });

  describe('findAll', () => {
    it('delegates to documentsService.findAll with user.id', async () => {
      mockDocumentsService.findAll.mockResolvedValue([]);

      await controller.findAll(student);

      expect(mockDocumentsService.findAll).toHaveBeenCalledWith(student.id);
    });
  });

  describe('findByUser', () => {
    it('delegates to documentsService.findForUser with target userId and the requesting user', async () => {
      mockDocumentsService.findForUser.mockResolvedValue([]);

      await controller.findByUser(5, admin);

      expect(mockDocumentsService.findForUser).toHaveBeenCalledWith(5, admin);
    });

    it('propagates ForbiddenException when the admin is out of promo scope', async () => {
      mockDocumentsService.findForUser.mockRejectedValue(
        new ForbiddenException('Hors de votre périmètre de promo'),
      );

      await expect(controller.findByUser(5, admin)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(mockDocumentsService.findForUser).toHaveBeenCalledWith(5, admin);
    });
  });

  describe('getDownloadUrl', () => {
    it('delegates to documentsService.getDownloadUrl with the numeric id and the requesting user (admin)', async () => {
      mockDocumentsService.getDownloadUrl.mockResolvedValue({
        url: 'http://...',
      });

      await controller.getDownloadUrl(5, admin);

      expect(mockDocumentsService.getDownloadUrl).toHaveBeenCalledWith(
        5,
        admin,
      );
    });

    it('delegates to documentsService.getDownloadUrl with the numeric id and the requesting user (student)', async () => {
      mockDocumentsService.getDownloadUrl.mockResolvedValue({
        url: 'http://...',
      });

      await controller.getDownloadUrl(5, student);

      expect(mockDocumentsService.getDownloadUrl).toHaveBeenCalledWith(
        5,
        student,
      );
    });
  });

  describe('getPendingReviews', () => {
    it('delegates to documentsService.getPendingReviews with the requesting user', async () => {
      mockDocumentsService.getPendingReviews.mockResolvedValue([]);

      await controller.getPendingReviews(admin);

      expect(mockDocumentsService.getPendingReviews).toHaveBeenCalledWith(
        admin,
      );
    });
  });

  describe('review', () => {
    it('delegates to documentsService.review with id, dto and the requesting user', async () => {
      const dto = { status: 'VALIDATED' } as any;
      mockDocumentsService.review.mockResolvedValue({ id: 7 });

      await controller.review(7, dto, admin);

      expect(mockDocumentsService.review).toHaveBeenCalledWith(7, dto, admin);
    });
  });

  describe('remove', () => {
    it('delegates to documentsService.remove with id and user.id', async () => {
      mockDocumentsService.remove.mockResolvedValue({ id: 3 });

      await controller.remove(3, student);

      expect(mockDocumentsService.remove).toHaveBeenCalledWith(3, student.id);
    });
  });
});
