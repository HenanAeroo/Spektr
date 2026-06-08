import { Test, TestingModule } from '@nestjs/testing';
import { AuthTasks } from './auth.tasks';
import { PrismaService } from '../../prisma/prisma.service';

const mockPrisma = {
  refreshToken: {
    deleteMany: jest.fn(),
  },
};

describe('AuthTasks', () => {
  let tasks: AuthTasks;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthTasks,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    tasks = module.get<AuthTasks>(AuthTasks);
  });

  afterEach(() => jest.clearAllMocks());

  describe('deleteTokens', () => {
    it('deletes expired refresh tokens with a date strictly less than now', async () => {
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 3 });

      const before = new Date();
      await tasks.deleteTokens();
      const after = new Date();

      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { expires_at: { lt: expect.any(Date) } },
      });

      const passedDate: Date =
        mockPrisma.refreshToken.deleteMany.mock.calls[0][0].where.expires_at.lt;
      expect(passedDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(passedDate.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });
});
