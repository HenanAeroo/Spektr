import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

const mockDocumentsService = {
  upload: jest.fn(),
  findAll: jest.fn(),
  getDownloadUrl: jest.fn(),
  remove: jest.fn(),
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

      await controller.uploadFile(file, '3', student);

      expect(mockDocumentsService.upload).toHaveBeenCalledWith(
        file,
        3,
        student.id,
      );
    });

    it('passes folderId as undefined if absent', async () => {
      const file = { originalname: 'cv.pdf' } as any;
      mockDocumentsService.upload.mockResolvedValue({ id: 1 });

      await controller.uploadFile(file, undefined, student);

      expect(mockDocumentsService.upload).toHaveBeenCalledWith(
        file,
        undefined,
        student.id,
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

  describe('getDownloadUrl', () => {
    it('passes userId as undefined for an admin', async () => {
      mockDocumentsService.getDownloadUrl.mockResolvedValue({
        url: 'http://...',
      });

      await controller.getDownloadUrl('5', admin);

      expect(mockDocumentsService.getDownloadUrl).toHaveBeenCalledWith(
        5,
        undefined,
      );
    });

    it('passes userId for a student', async () => {
      mockDocumentsService.getDownloadUrl.mockResolvedValue({
        url: 'http://...',
      });

      await controller.getDownloadUrl('5', student);

      expect(mockDocumentsService.getDownloadUrl).toHaveBeenCalledWith(
        5,
        student.id,
      );
    });
  });

  describe('remove', () => {
    it('delegates to documentsService.remove with id and user.id', async () => {
      mockDocumentsService.remove.mockResolvedValue({ id: 3 });

      await controller.remove('3', student);

      expect(mockDocumentsService.remove).toHaveBeenCalledWith(3, student.id);
    });
  });
});
