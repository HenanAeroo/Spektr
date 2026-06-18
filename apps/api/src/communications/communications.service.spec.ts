import { Test, TestingModule } from '@nestjs/testing';
import { CommunicationsService } from './communications.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  communication: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('CommunicationsService', () => {
  let service: CommunicationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunicationsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CommunicationsService>(CommunicationsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('calls prisma.communication.create with the dto fields', async () => {
      const dto = {
        senderId: 1,
        recipientId: 2,
        type: 'EMAIL' as any,
        subject: 'Test',
        body: 'Hello',
        score: undefined,
      };
      mockPrisma.communication.create.mockResolvedValue({ id: 1, ...dto });

      await service.create(dto);

      expect(mockPrisma.communication.create).toHaveBeenCalledWith({
        data: {
          senderId: dto.senderId,
          recipientId: dto.recipientId,
          type: dto.type,
          subject: dto.subject,
          body: dto.body,
          score: dto.score,
        },
      });
    });
  });
});
