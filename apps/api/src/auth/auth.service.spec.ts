jest.mock('bcrypt');

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import bcrypt from 'bcrypt';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';

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
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },

  $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
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
    it('throws UnauthorizedException if token is not found in DB', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refresh('raw-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects an expired token without mutating it (C7)', async () => {
      // Expiry is validated before any write, so an expired token is rejected
      // without a delete/update (no delete-then-throw self-DoS edge).
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        token: 'hashed',
        expires_at: new Date(Date.now() - 1000),
        user: { id: 1, role: 'STUDENT' },
      });

      await expect(service.refresh('raw-token')).rejects.toThrow(
        UnauthorizedException,
      );

      expect(mockPrisma.refreshToken.update).not.toHaveBeenCalled();
      expect(mockPrisma.refreshToken.delete).not.toHaveBeenCalled();
    });

    it('rotates the token into a grace window and issues fresh tokens (M9)', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        token: 'hashed',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        user: { id: 1, role: 'STUDENT' },
      });
      mockPrisma.refreshToken.update.mockResolvedValue({});
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, role: 'STUDENT' });
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await service.refresh('raw-token');

      // Presented token is shrunk to the grace window rather than hard-deleted.
      expect(mockPrisma.refreshToken.update).toHaveBeenCalledTimes(1);
      const lookupArg = mockPrisma.refreshToken.findUnique.mock.calls[0][0];
      const updateArg = mockPrisma.refreshToken.update.mock.calls[0][0];
      // Rotates the exact (hashed) token that was looked up.
      expect(updateArg.where.token).toBe(lookupArg.where.token);
      expect(updateArg.data.expires_at.getTime()).toBeLessThan(
        Date.now() + 60_000,
      );
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });

  describe('logout', () => {
    it('deletes all refresh tokens for the user', async () => {
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      await service.logout(1);

      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
    });
  });

  describe('verifyEmail', () => {
    it('throws BadRequestException if token is not found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.verifyEmail('bad-token')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException if token is expired', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 1,
        verificationExpiry: new Date(Date.now() - 1000),
      });

      await expect(service.verifyEmail('expired-token')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('confirms the email and clears verification fields', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 1,
        verificationExpiry: new Date(Date.now() + 60_000),
      });
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.verifyEmail('valid-token');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          emailVerified: true,
          verificationToken: null,
          verificationExpiry: null,
        },
      });
      expect(result).toBe('Email confirmé');
    });
  });

  describe('forgotPassword', () => {
    it('returns neutral response without calling send if user is unknown', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.forgotPassword('unknown@example.com');

      expect(mockMailService.send).not.toHaveBeenCalled();
      expect(result).toBe('Un email de réinitialisation a été envoyé');
    });

    it('returns neutral response if account is Google only', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'user@example.com',
        first_name: 'John',
        authProviders: [{ provider: 'google' }],
      });

      const result = await service.forgotPassword('user@example.com');

      expect(mockMailService.send).not.toHaveBeenCalled();
      expect(result).toBe('Un email de réinitialisation a été envoyé');
    });

    it('updates the reset token and sends the email if account is local', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'user@example.com',
        first_name: 'John',
        authProviders: [{ provider: 'local' }],
      });
      mockPrisma.user.update.mockResolvedValue({});
      mockMailService.send.mockResolvedValue(undefined);

      const result = await service.forgotPassword('user@example.com');

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            resetPasswordToken: expect.any(String),
            resetPasswordExpiry: expect.any(Date),
          }),
        }),
      );
      expect(mockMailService.send).toHaveBeenCalledTimes(1);
      expect(result).toBe('Un email de réinitialisation a été envoyé');
    });
  });

  describe('validateOAuthLogin', () => {
    const makeProfile = (email?: string) =>
      ({
        id: 'google-id-123',
        emails: email ? [{ value: email }] : [],
        name: { givenName: 'John', familyName: 'Doe' },
      }) as any;

    it('throws Error if Google profile has no email', async () => {
      await expect(service.validateOAuthLogin(makeProfile())).rejects.toThrow(
        'Email Google manquant',
      );
    });

    it('returns tokens if Google provider already exists', async () => {
      mockPrisma.authProvider.findUnique.mockResolvedValue({
        user: { id: 1, role: 'STUDENT' },
      });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, role: 'STUDENT' });
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await service.validateOAuthLogin(
        makeProfile('john@example.com'),
      );

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('creates a new user if email is unknown', async () => {
      mockPrisma.authProvider.findUnique.mockResolvedValue(null);
      mockUsersService.findOne.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ id: 2, role: 'STUDENT' });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 2, role: 'STUDENT' });
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await service.validateOAuthLogin(
        makeProfile('new@example.com'),
      );

      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('links Google account to existing local account if email is known', async () => {
      mockPrisma.authProvider.findUnique.mockResolvedValue(null);
      mockUsersService.findOne.mockResolvedValue({ id: 3 });
      mockPrisma.authProvider.create.mockResolvedValue({});
      mockPrisma.user.findUnique.mockResolvedValue({ id: 3, role: 'STUDENT' });
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await service.validateOAuthLogin(
        makeProfile('existing@example.com'),
      );

      expect(mockPrisma.authProvider.create).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });

  describe('resetPassword', () => {
    it('throws BadRequestException if token is not found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.resetPassword('bad-token', 'NewPass1!'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if token is expired', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 1,
        resetPasswordExpiry: new Date(Date.now() - 1000),
        authProviders: [{ provider: 'local' }],
      });

      await expect(
        service.resetPassword('expired-token', 'NewPass1!'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if account has no local provider', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 1,
        resetPasswordExpiry: new Date(Date.now() + 60_000),
        authProviders: [{ provider: 'google' }],
      });

      await expect(
        service.resetPassword('valid-token', 'NewPass1!'),
      ).rejects.toThrow(BadRequestException);
    });

    it('updates the password and clears the reset token', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 1,
        resetPasswordExpiry: new Date(Date.now() + 60_000),
        authProviders: [{ provider: 'local' }],
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_new_pw');
      mockPrisma.authProvider.update.mockResolvedValue({});
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.resetPassword('valid-token', 'NewPass1!');

      expect(bcrypt.hash).toHaveBeenCalledWith('NewPass1!', 12);
      expect(mockPrisma.authProvider.update).toHaveBeenCalled();
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: { resetPasswordToken: null, resetPasswordExpiry: null },
        }),
      );
      expect(result).toBe('Mot de passe réinitialisé');
    });
  });
});
