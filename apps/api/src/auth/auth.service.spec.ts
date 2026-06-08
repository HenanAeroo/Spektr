jest.mock('bcrypt');

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import bcrypt from 'bcrypt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

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

  describe('localRegister', () => {
    it('throw a ConflictEception if the email already used', async () => {
      mockUsersService.findOne.mockResolvedValue({ id: 1 });

      await expect(
        service.localRegister({
          email: 'test@gmail.com',
          password: 'Test1234!',
          first_name: 'John',
          last_name: 'Doe',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('create the user and send a confirmation email', async () => {
      mockUsersService.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_pw');
      mockPrisma.user.create.mockResolvedValue({
        id: 1,
        email: 'test@gmail.com',
      });
      mockPrisma.user.update.mockResolvedValue({
        id: 1,
        email: 'test@gmail.com',
        first_name: 'Test',
      });

      const result = await service.localRegister({
        email: 'test@gmail.com',
        password: 'Test1234!',
        first_name: 'Test',
        last_name: 'User',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('Test1234!', 12);
      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(mockPrisma.user.update).toHaveBeenCalled();
      expect(mockMailService.send).toHaveBeenCalledTimes(1);
      expect(result).toBe('Un email de confirmation a été envoyé');
    });
  });

  describe('localLogin', () => {
    it('throw UnauthorizedException if the email is not verified', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        emailVerified: false,
      });

      await expect(
        service.localLogin({ sub: 1, role: 'STUDENT' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns accessToken and refreshToken if the email is verified', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        emailVerified: true,
        role: 'STUDENT',
      });
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await service.localLogin({ sub: 1, role: 'STUDENT' });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });

  describe('refresh', () => {
    it('lève UnauthorizedException si le token est introuvable en base', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refresh('raw-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('supprime le token AVANT de lever une exception si expiré (anti-rejeu)', async () => {
      // delete-before-check intentionnel : si deux requêtes simultanées arrivent avec le même token
      // (vol + usage légitime), la seconde échoue car le token est déjà supprimé.
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        token: 'hashed',
        expires_at: new Date(Date.now() - 1000),
        user: { id: 1, role: 'STUDENT' },
      });
      mockPrisma.refreshToken.delete.mockResolvedValue({});

      await expect(service.refresh('raw-token')).rejects.toThrow(
        UnauthorizedException,
      );

      // Garantit que delete a été appelé AVANT que l'exception soit levée
      expect(mockPrisma.refreshToken.delete).toHaveBeenCalledTimes(1);
    });

    it('retourne accessToken et refreshToken si le token est valide', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        token: 'hashed',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        user: { id: 1, role: 'STUDENT' },
      });
      mockPrisma.refreshToken.delete.mockResolvedValue({});
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, role: 'STUDENT' });
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await service.refresh('raw-token');

      expect(mockPrisma.refreshToken.delete).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });
});
