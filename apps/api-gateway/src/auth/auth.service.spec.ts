import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let mockUsersService: any;
  let mockJwtService: any;

  const sampleUser = {
    id: 'user-uuid-1',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashed_password',
    role: 'USER',
    isActive: true,
    refreshTokenHash: 'hashed_refresh',
  };

  beforeEach(async () => {
    mockUsersService = {
      create: jest.fn().mockResolvedValue(sampleUser),
      findByEmail: jest.fn().mockResolvedValue(sampleUser),
      findById: jest.fn().mockResolvedValue(sampleUser),
      updateRefreshToken: jest.fn().mockResolvedValue(undefined),
    };

    mockJwtService = {
      signAsync: jest.fn().mockResolvedValue('jwt_token_mock'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should create user and return tokens', async () => {
      const res = await service.register({
        email: 'test@example.com',
        name: 'Test User',
        password: 'Password123!',
      });

      expect(res.accessToken).toBe('jwt_token_mock');
      expect(res.refreshToken).toBe('jwt_token_mock');
      expect(res.user.email).toBe('test@example.com');
      expect(mockUsersService.create).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should authenticate user and return tokens', async () => {
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

      const res = await service.login({
        email: 'test@example.com',
        password: 'Password123!',
      });

      expect(res.accessToken).toBe('jwt_token_mock');
      expect(res.user.id).toBe('user-uuid-1');
    });

    it('should throw UnauthorizedException on invalid password', async () => {
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      await expect(
        service.login({ email: 'test@example.com', password: 'WrongPassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
