import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';
import { AppLogger } from '../logger/app-logger.service';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let appLogger: jest.Mocked<AppLogger>;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockCallHandler: jest.Mocked<CallHandler>;
  let mockHttpArgumentsHost: any;

  const mockRequest = {
    method: 'GET',
    url: '/api/test',
    headers: {
      'user-agent': 'test-agent',
    },
    ip: '127.0.0.1',
    user: {
      sub: 'user123',
      email: 'test@example.com',
    },
  };

  const mockResponse = {
    statusCode: 200,
  };

  beforeEach(async () => {
    const mockAppLogger = {
      setContext: jest.fn(),
      logRequest: jest.fn(),
      logResponse: jest.fn(),
      logError: jest.fn(),
      logPerformanceMetric: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggingInterceptor,
        {
          provide: AppLogger,
          useValue: mockAppLogger,
        },
      ],
    }).compile();

    interceptor = module.get<LoggingInterceptor>(LoggingInterceptor);
    appLogger = module.get(AppLogger);

    // Create fresh mocks for each test
    mockHttpArgumentsHost = {
      getRequest: jest.fn().mockReturnValue(mockRequest),
      getResponse: jest.fn().mockReturnValue(mockResponse),
      getNext: jest.fn(),
    };

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue(mockHttpArgumentsHost),
      getClass: jest.fn(),
      getHandler: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    } as any;

    mockCallHandler = {
      handle: jest.fn(),
    } as any;

    // Mock Date.now to control timing
    jest
      .spyOn(Date, 'now')
      .mockReturnValueOnce(1000) // Start time
      .mockReturnValueOnce(1500); // End time (500ms response)
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should log request and response successfully', (done) => {
    (mockCallHandler.handle as jest.Mock).mockReturnValue(of('test response'));

    const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

    result.subscribe({
      next: (data) => {
        expect(data).toBe('test response');

        // Verify logging calls
        expect(appLogger.setContext).toHaveBeenCalledWith({
          requestId: expect.any(String),
          method: 'GET',
          url: '/api/test',
          userAgent: 'test-agent',
          ip: '127.0.0.1',
          userId: 'user123',
        });

        expect(appLogger.logRequest).toHaveBeenCalledWith(
          'GET',
          '/api/test',
          expect.objectContaining({
            requestId: expect.any(String),
            userAgent: 'test-agent',
            ip: '127.0.0.1',
            userId: 'user123',
          }),
        );

        expect(appLogger.logResponse).toHaveBeenCalledWith(
          'GET',
          '/api/test',
          200,
          500,
          expect.objectContaining({
            requestId: expect.any(String),
            method: 'GET',
            url: '/api/test',
            userAgent: 'test-agent',
            ip: '127.0.0.1',
            userId: 'user123',
          }),
        );

        // Performance metric is only logged for slow requests (>1000ms)
        // Since we mocked 500ms response time, it should NOT be called
        expect(appLogger.logPerformanceMetric).not.toHaveBeenCalled();

        done();
      },
      error: done,
    });
  });

  it('should handle request without user', (done) => {
    const requestWithoutUser = {
      ...mockRequest,
      user: undefined,
    };

    (mockHttpArgumentsHost.getRequest as jest.Mock).mockReturnValue(
      requestWithoutUser,
    );
    (mockCallHandler.handle as jest.Mock).mockReturnValue(of('test response'));

    const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

    result.subscribe({
      next: () => {
        expect(appLogger.setContext).toHaveBeenCalledWith({
          requestId: expect.any(String),
          method: 'GET',
          url: '/api/test',
          userAgent: 'test-agent',
          ip: '127.0.0.1',
          userId: undefined,
        });

        expect(appLogger.logRequest).toHaveBeenCalledWith(
          'GET',
          '/api/test',
          expect.objectContaining({
            requestId: expect.any(String),
            userAgent: 'test-agent',
            ip: '127.0.0.1',
            userId: undefined,
          }),
        );

        done();
      },
      error: done,
    });
  });

  it('should handle request without user-agent header', (done) => {
    const requestWithoutUserAgent = {
      ...mockRequest,
      headers: {},
    };

    (mockHttpArgumentsHost.getRequest as jest.Mock).mockReturnValue(
      requestWithoutUserAgent,
    );
    (mockCallHandler.handle as jest.Mock).mockReturnValue(of('test response'));

    const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

    result.subscribe({
      next: () => {
        expect(appLogger.setContext).toHaveBeenCalledWith({
          requestId: expect.any(String),
          method: 'GET',
          url: '/api/test',
          userAgent: '',
          ip: '127.0.0.1',
          userId: 'user123',
        });

        done();
      },
      error: done,
    });
  });

  it('should log slow requests with warning', (done) => {
    // Reset all mocks and setup new Date.now mock for slow request (>1000ms)
    jest.restoreAllMocks();
    jest
      .spyOn(Date, 'now')
      .mockReturnValueOnce(1000) // Start time
      .mockReturnValueOnce(2500); // End time (1500ms response)

    (mockCallHandler.handle as jest.Mock).mockReturnValue(of('slow response'));

    const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

    result.subscribe({
      next: () => {
        expect(appLogger.logPerformanceMetric).toHaveBeenCalledWith(
          'slow_request',
          1500,
          'ms',
        );

        done();
      },
      error: done,
    });
  });

  it('should handle fast requests normally', (done) => {
    // Use default fast timing (500ms) from beforeEach
    (mockCallHandler.handle as jest.Mock).mockReturnValue(of('fast response'));

    const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

    result.subscribe({
      next: () => {
        // Fast requests (<1000ms) should NOT trigger performance logging
        expect(appLogger.logPerformanceMetric).not.toHaveBeenCalled();

        done();
      },
      error: done,
    });
  });

  it('should handle errors and log them', (done) => {
    const testError = new Error('Test error');
    (mockCallHandler.handle as jest.Mock).mockReturnValue(
      throwError(() => testError),
    );

    const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

    result.subscribe({
      next: () => {
        done(new Error('Expected error but got success'));
      },
      error: (error) => {
        expect(error).toBe(testError);
        expect(appLogger.logError).toHaveBeenCalledWith(
          testError,
          expect.objectContaining({
            requestId: expect.any(String),
            method: 'GET',
            url: '/api/test',
          }),
        );

        done();
      },
    });
  });

  it('should handle different HTTP methods', (done) => {
    const postRequest = {
      ...mockRequest,
      method: 'POST',
      url: '/api/create',
    };

    (mockHttpArgumentsHost.getRequest as jest.Mock).mockReturnValue(
      postRequest,
    );
    (mockCallHandler.handle as jest.Mock).mockReturnValue(of('created'));

    const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

    result.subscribe({
      next: () => {
        expect(appLogger.logRequest).toHaveBeenCalledWith(
          'POST',
          '/api/create',
          expect.any(Object),
        );

        expect(appLogger.logResponse).toHaveBeenCalledWith(
          'POST',
          '/api/create',
          200,
          500,
          expect.any(Object),
        );

        // Fast requests (<1000ms) should NOT trigger performance logging
        expect(appLogger.logPerformanceMetric).not.toHaveBeenCalled();

        done();
      },
      error: done,
    });
  });

  it('should handle different response status codes', (done) => {
    const errorResponse = {
      statusCode: 404,
    };

    (mockHttpArgumentsHost.getResponse as jest.Mock).mockReturnValue(
      errorResponse,
    );
    (mockCallHandler.handle as jest.Mock).mockReturnValue(of('not found'));

    const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

    result.subscribe({
      next: () => {
        expect(appLogger.logResponse).toHaveBeenCalledWith(
          'GET',
          '/api/test',
          404,
          500,
          expect.objectContaining({
            requestId: expect.any(String),
            method: 'GET',
            url: '/api/test',
            userAgent: 'test-agent',
            ip: '127.0.0.1',
            userId: 'user123',
          }),
        );

        // Fast requests (<1000ms) should NOT trigger performance logging
        expect(appLogger.logPerformanceMetric).not.toHaveBeenCalled();

        done();
      },
      error: done,
    });
  });

  it('should generate unique request IDs for each request', (done) => {
    (mockCallHandler.handle as jest.Mock).mockReturnValue(of('response1'));

    const result1 = interceptor.intercept(
      mockExecutionContext,
      mockCallHandler,
    );

    result1.subscribe({
      next: () => {
        const firstRequestId = (appLogger.setContext as jest.Mock).mock
          .calls[0][0].requestId;

        // Reset mocks for second request
        jest.clearAllMocks();
        (mockCallHandler.handle as jest.Mock).mockReturnValue(of('response2'));

        const result2 = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result2.subscribe({
          next: () => {
            const secondRequestId = (appLogger.setContext as jest.Mock).mock
              .calls[0][0].requestId;
            expect(firstRequestId).not.toBe(secondRequestId);
            done();
          },
          error: done,
        });
      },
      error: done,
    });
  });
});
