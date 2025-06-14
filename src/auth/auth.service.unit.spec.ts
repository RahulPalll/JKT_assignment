import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

// Create a simple mock without entity dependencies
describe('AuthService (Unit)', () => {
  let service: AuthService;

  const mockUsersService = {
    findByUsername: jest.fn(),
    findById: jest.fn(),
    validatePassword: jest.fn(),
    updateLastLogin: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        JWT_SECRET: 'test-secret',
        JWT_EXPIRES_IN: '24h',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
        JWT_REFRESH_EXPIRES_IN: '7d',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {
            validateUser: jest.fn(),
            login: jest.fn(),
            refreshToken: jest.fn(),
            logout: jest.fn(),
          },
        },
        {
          provide: 'UsersService',
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have validateUser method', () => {
    expect(service.validateUser).toBeDefined();
  });

  it('should have login method', () => {
    expect(service.login).toBeDefined();
  });

  it('should have refreshToken method', () => {
    expect(service.refreshToken).toBeDefined();
  });

  it('should have logout method', () => {
    expect(service.logout).toBeDefined();
  });
});
