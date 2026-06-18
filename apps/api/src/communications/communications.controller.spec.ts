import { Test, TestingModule } from '@nestjs/testing';
import { CommunicationsController } from './communications.controller';
import { CommunicationsService } from './communications.service';

const mockCommunicationsService = {
  findAll: jest.fn(),
};

describe('CommunicationsController', () => {
  let controller: CommunicationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommunicationsController],
      providers: [
        { provide: CommunicationsService, useValue: mockCommunicationsService },
      ],
    }).compile();

    controller = module.get<CommunicationsController>(CommunicationsController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('delegates to communicationsService.findAll', async () => {
      mockCommunicationsService.findAll.mockResolvedValue([]);

      await controller.findAll(undefined as any, undefined as any);

      expect(mockCommunicationsService.findAll).toHaveBeenCalledWith(
        undefined,
        undefined,
      );
    });
  });
});
