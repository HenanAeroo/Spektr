import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

const mockAuthService = {
  localRegister: jest.fn(),
  localLogin: jest.fn(),
  refresh: jest.fn(),
  logout: jest.fn(),
  verifyEmail: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue('http://localhost:3000'),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => jest.clearAllMocks());

  const mockRes = () => ({
    cookie: jest.fn(),
    clearCookie: jest.fn(),
    json: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
  });

  describe('register', () => {
    it('delegates to authService.localRegister', async () => {
      mockAuthService.localRegister.mockResolvedValue(
        'Un email de confirmation a été envoyé',
      );
      const dto = {
        email: 'test@example.com',
        password: 'Test1234!',
        first_name: 'John',
        last_name: 'Doe',
      };

      await controller.register(dto as any);

      expect(mockAuthService.localRegister).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('delegates to authService.localLogin and sets the refreshToken cookie', async () => {
      mockAuthService.localLogin.mockResolvedValue({
        accessToken: 'at',
        refreshToken: 'rt',
      });
      const res = mockRes();
      const user = { sub: 1, role: 'STUDENT' };

      const result = await controller.login(user as any, res as any);

      expect(mockAuthService.localLogin).toHaveBeenCalledWith(user);
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'rt',
        expect.any(Object),
      );
      expect(result).toEqual({ accessToken: 'at' });
    });
  });

  describe('refresh', () => {
    it('delegates to authService.refresh with cookie token', async () => {
      mockAuthService.refresh.mockResolvedValue({
        accessToken: 'new-at',
        refreshToken: 'new-rt',
      });
      const req = { cookies: { refreshToken: 'raw-rt' } };
      const res = mockRes();

      const result = await controller.refresh(req as any, res as any);

      expect(mockAuthService.refresh).toHaveBeenCalledWith('raw-rt');
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'new-rt',
        expect.any(Object),
      );
      expect(result).toEqual({ accessToken: 'new-at' });
    });

    it('throws UnauthorizedException if cookie is missing', async () => {
      const req = { cookies: {} };
      const res = mockRes();

      await expect(controller.refresh(req as any, res as any)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockAuthService.refresh).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('delegates to authService.logout and clears the cookie', async () => {
      mockAuthService.logout.mockResolvedValue(undefined);
      const res = mockRes();
      const user = { sub: 1, role: 'STUDENT' };

      const result = await controller.logout(user as any, res as any);

      expect(mockAuthService.logout).toHaveBeenCalledWith(1);
      expect(res.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.any(Object),
      );
      expect(result).toEqual({ message: 'Déconnecté' });
    });
  });

  describe('verifyEmail', () => {
    it('delegates to authService.verifyEmail', async () => {
      mockAuthService.verifyEmail.mockResolvedValue('Email confirmé');

      const result = await controller.verifyEmail('token123');

      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith('token123');
      expect(result).toEqual({ message: 'Email confirmé' });
    });
  });

  describe('forgotPassword', () => {
    it('delegates to authService.forgotPassword', async () => {
      mockAuthService.forgotPassword.mockResolvedValue(
        'Un email de réinitialisation a été envoyé',
      );

      await controller.forgotPassword({ email: 'user@example.com' } as any);

      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(
        'user@example.com',
      );
    });
  });

  describe('resetPassword', () => {
    it('delegates to authService.resetPassword', async () => {
      mockAuthService.resetPassword.mockResolvedValue(
        'Mot de passe réinitialisé',
      );

      await controller.resetPassword({
        token: 'tok',
        password: 'NewPass1!',
      } as any);

      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(
        'tok',
        'NewPass1!',
      );
    });
  });
});
