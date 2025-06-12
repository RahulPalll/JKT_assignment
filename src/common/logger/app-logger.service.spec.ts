import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { AppLogger, LogContext } from './app-logger.service';

describe('AppLogger', () => {
  let service: AppLogger;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(async () => {
    // Create a mock logger instance
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      fatal: jest.fn(),
      setContext: jest.fn(),
      localInstance: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [AppLogger],
    })
    .overrideProvider(Logger)
    .useValue(mockLogger)
    .compile();

    service = module.get<AppLogger>(AppLogger);
    // Override the internal logger
    (service as any).logger = mockLogger;
  });

  afterEach(() => {
    jest.clearAllMocks();
    if (service) {
      service.clearContext();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('context management', () => {
    it('should set and clear context', () => {
      const context: LogContext = { userId: 'user123', requestId: 'req456' };
      
      service.setContext(context);
      service.log('Test message');
      
      expect(mockLogger.log).toHaveBeenCalledWith('Test message | userId=user123 requestId=req456');
      
      service.clearContext();
      service.log('Test message');
      
      expect(mockLogger.log).toHaveBeenCalledWith('Test message');
    });

    it('should merge contexts properly', () => {
      service.setContext({ userId: 'user123' });
      service.logWithContext('Test message', { requestId: 'req456' });
      
      expect(mockLogger.log).toHaveBeenCalledWith('Test message | userId=user123 requestId=req456');
    });
  });

  describe('basic logging methods', () => {
    it('should log messages', () => {
      service.log('Test log message', 'TestContext');
      expect(mockLogger.log).toHaveBeenCalledWith('Test log message | context=TestContext');
    });

    it('should log errors', () => {
      service.error('Test error message', 'stack trace', 'TestContext');
      expect(mockLogger.error).toHaveBeenCalledWith('Test error message | context=TestContext', 'stack trace');
    });

    it('should log warnings', () => {
      service.warn('Test warning message', 'TestContext');
      expect(mockLogger.warn).toHaveBeenCalledWith('Test warning message | context=TestContext');
    });

    it('should log debug messages', () => {
      service.debug('Test debug message', 'TestContext');
      expect(mockLogger.debug).toHaveBeenCalledWith('Test debug message | context=TestContext');
    });

    it('should log verbose messages', () => {
      service.verbose('Test verbose message', 'TestContext');
      expect(mockLogger.verbose).toHaveBeenCalledWith('Test verbose message | context=TestContext');
    });
  });

  describe('context-aware logging methods', () => {
    it('should log with context', () => {
      const context: LogContext = { userId: 'user123', action: 'login' };
      service.logWithContext('User logged in', context);
      
      expect(mockLogger.log).toHaveBeenCalledWith('User logged in | userId=user123 action=login');
    });

    it('should log errors with context', () => {
      const context: LogContext = { userId: 'user123', action: 'error' };
      service.errorWithContext('An error occurred', 'stack trace', context);
      
      expect(mockLogger.error).toHaveBeenCalledWith('An error occurred | userId=user123 action=error', 'stack trace');
    });

    it('should log warnings with context', () => {
      const context: LogContext = { userId: 'user123', action: 'warning' };
      service.warnWithContext('A warning occurred', context);
      
      expect(mockLogger.warn).toHaveBeenCalledWith('A warning occurred | userId=user123 action=warning');
    });

    it('should log debug with context', () => {
      const context: LogContext = { userId: 'user123', action: 'debug' };
      service.debugWithContext('Debug information', context);
      
      expect(mockLogger.debug).toHaveBeenCalledWith('Debug information | userId=user123 action=debug');
    });
  });

  describe('request logging methods', () => {
    it('should log requests', () => {
      service.logRequest('GET', '/api/users', { userAgent: 'Mozilla/5.0' });
      
      expect(mockLogger.log).toHaveBeenCalledWith('GET /api/users | method=GET url=/api/users userAgent=Mozilla/5.0');
    });

    it('should log responses', () => {
      service.logResponse('GET', '/api/users', 200, 150, { userId: 'user123' });
      
      expect(mockLogger.log).toHaveBeenCalledWith(
        'GET /api/users 200 150ms | method=GET url=/api/users statusCode=200 responseTime=150ms userId=user123'
      );
    });

    it('should log errors with stack trace', () => {
      const error = new Error('Test error');
      error.stack = 'Error stack trace';
      
      service.logError(error, { userId: 'user123' });
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error: Test error | userId=user123',
        'Error stack trace'
      );
    });
  });

  describe('business logic logging methods', () => {
    it('should log user actions', () => {
      service.logUserAction('login', 'user123', { method: 'password' });
      
      expect(mockLogger.log).toHaveBeenCalledWith(
        'User action: login | userId=user123 action=login details={"method":"password"}'
      );
    });

    it('should log user actions without details', () => {
      service.logUserAction('logout', 'user123');
      
      expect(mockLogger.log).toHaveBeenCalledWith(
        'User action: logout | userId=user123 action=logout'
      );
    });

    it('should log security events', () => {
      service.logSecurityEvent('failed_login', 'user123', '192.168.1.1', { attempts: 3 });
      
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Security event: failed_login | userId=user123 ip=192.168.1.1 event=failed_login details={"attempts":3}'
      );
    });

    it('should log security events without optional parameters', () => {
      service.logSecurityEvent('suspicious_activity');
      
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Security event: suspicious_activity | event=suspicious_activity'
      );
    });

    it('should log performance metrics', () => {
      service.logPerformanceMetric('database_query', 125, 'ms');
      
      expect(mockLogger.log).toHaveBeenCalledWith(
        'Performance: database_query = 125ms | metric=database_query value=125 unit=ms'
      );
    });

    it('should log performance metrics with default unit', () => {
      service.logPerformanceMetric('api_response', 200);
      
      expect(mockLogger.log).toHaveBeenCalledWith(
        'Performance: api_response = 200ms | metric=api_response value=200 unit=ms'
      );
    });
  });

  describe('message formatting', () => {
    it('should handle empty context', () => {
      service.logWithContext('Simple message');
      
      expect(mockLogger.log).toHaveBeenCalledWith('Simple message');
    });

    it('should filter undefined values from context', () => {
      const context: LogContext = {
        userId: 'user123',
        requestId: undefined,
        action: 'test'
      };
      
      service.logWithContext('Test message', context);
      
      expect(mockLogger.log).toHaveBeenCalledWith('Test message | userId=user123 action=test');
    });

    it('should handle complex context values', () => {
      const context: LogContext = {
        userId: 'user123',
        customField: 'custom value',
        anotherField: 'another value'
      };
      
      service.logWithContext('Test message', context);
      
      expect(mockLogger.log).toHaveBeenCalledWith(
        'Test message | userId=user123 customField=custom value anotherField=another value'
      );
    });
  });
});