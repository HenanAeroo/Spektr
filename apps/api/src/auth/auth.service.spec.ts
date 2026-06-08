jest.mock('bcrypt');

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import bcrypt from 'bcrypt';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },

  authProvider: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },

  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
};

const mockUsersService = {
  findOne: jest.fn(),
};

const mockMailService = {
  send: jest.fn(),
};

const mockJwt = {
  signAsync: jest.fn().mockResolvedValue('mocked.access.token'),
};

const mockConfig = {
  get: jest.fn().mockImplementation((key) => {
    if (key === 'JWT_SECRET') return 'test-secret';
    if (key === 'FRONT_URL') return 'http://localhost:3000';
  }),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
        { provide: UsersService, useValue: mockUsersService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('validateLocal', () => {
    it('return null if user is not find', async () => {
      mockUsersService.findOne.mockResolvedValue(null);

      const result = await service.validateLocal('test@gmail.com', 'Test1234!');

      expect(result).toBeNull();
    });

    it('user find but not unique', async () => {
      mockUsersService.findOne.mockResolvedValue({
        id: 1,
        email: 'test@gmail.com',
      });
      mockPrisma.authProvider.findUnique.mockResolvedValue({});

      const result = await service.validateLocal('test@gmail.com', 'Test1234!');

      expect(result).toBeNull();
    });

    it('user find but the passwords are not the same', async () => {
      mockUsersService.findOne.mockResolvedValue({
        id: 1,
        email: 'test@gmail.com',
      });
      mockPrisma.authProvider.findUnique.mockResolvedValue({
        id: 1,
        email: 'test@gmail.com',
        password: 'test123',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateLocal('test@gmail.com', 'Test1234!');

      expect(bcrypt.compare).toHaveBeenCalledWith('Test1234!', 'test123');
      expect(result).toBeNull();
    });

    it('returns user if password matches', async () => {
      mockUsersService.findOne.mockResolvedValue({
        id: 1,
        email: 'test@gmail.com',
      });
      mockPrisma.authProvider.findUnique.mockResolvedValue({
        id: 1,
        email: 'test@gmail.com',
        password: 'Test1234!',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateLocal('test@gmail.com', 'Test1234!');

      expect(bcrypt.compare).toHaveBeenCalledWith('Test1234!', 'Test1234!');
      expect(result).toEqual({
        id: 1,
        email: 'test@gmail.com',
      });
    });
  });
});
