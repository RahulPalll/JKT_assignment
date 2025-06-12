import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  let dataSource: jest.Mocked<DataSource>;

  beforeEach(async () => {
    const mockDataSource = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    dataSource = module.get(DataSource);

    // Mock environment variables
    process.env.NODE_ENV = 'test';
    process.env.npm_package_version = '1.0.0';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHealthStatus', () => {
    it('should return basic health status', async () => {
      const result = await service.getHealthStatus();

      expect(result).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        environment: 'test',
        version: '1.0.0',
      });
    });

    it('should use default values when environment variables are not set', async () => {
      delete process.env.NODE_ENV;
      delete process.env.npm_package_version;

      const result = await service.getHealthStatus();

      expect(result).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        environment: 'development',
        version: '1.0.0',
      });
    });
  });

  describe('getDetailedHealthStatus', () => {
    it('should return detailed health status with successful checks', async () => {
      dataSource.query.mockResolvedValue([{ '?column?': 1 }]);

      const result = await service.getDetailedHealthStatus();

      expect(result).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        environment: 'test',
        version: '1.0.0',
        responseTime: expect.any(Number),
        checks: {
          database: {
            status: 'healthy',
            responseTime: expect.any(Number),
            connection: 'active',
          },
          memory: {
            status: 'healthy',
            heap: {
              used: expect.any(Number),
              total: expect.any(Number),
            },
            system: {
              total: expect.any(Number),
              free: expect.any(Number),
              used: expect.any(Number),
            },
            rss: expect.any(Number),
            external: expect.any(Number),
          },
        },
      });
    });

    it('should handle database check failure', async () => {
      const dbError = new Error('Database connection failed');
      dataSource.query.mockRejectedValue(dbError);

      const result = await service.getDetailedHealthStatus();

      expect(result.checks.database).toEqual({
        status: 'error',
        message: 'Database connection failed',
      });
    });

    it('should handle unknown database error', async () => {
      dataSource.query.mockRejectedValue('Unknown error');

      const result = await service.getDetailedHealthStatus();

      expect(result.checks.database).toEqual({
        status: 'error',
        message: 'Database check failed',
      });
    });
  });

  describe('getReadinessStatus', () => {
    it('should return ready status when database is healthy', async () => {
      dataSource.query.mockResolvedValue([{ '?column?': 1 }]);

      const result = await service.getReadinessStatus();

      expect(result).toEqual({
        status: 'ready',
        timestamp: expect.any(String),
      });
    });

    it('should throw error when database is unhealthy', async () => {
      const dbError = new Error('Database connection failed');
      dataSource.query.mockRejectedValue(dbError);

      await expect(service.getReadinessStatus()).rejects.toThrow(
        'Application is not ready'
      );
    });
  });

  describe('getLivenessStatus', () => {
    it('should return liveness status', async () => {
      const result = await service.getLivenessStatus();

      expect(result).toEqual({
        status: 'alive',
        timestamp: expect.any(String),
        pid: expect.any(Number),
      });
    });
  });

  describe('checkDatabase', () => {
    it('should return healthy status when database query succeeds', async () => {
      dataSource.query.mockResolvedValue([{ '?column?': 1 }]);

      // Access private method for testing
      const result = await (service as any).checkDatabase();

      expect(result).toEqual({
        status: 'healthy',
        responseTime: expect.any(Number),
        connection: 'active',
      });
      expect(dataSource.query).toHaveBeenCalledWith('SELECT 1');
    });

    it('should return unhealthy status when database query fails', async () => {
      const dbError = new Error('Connection timeout');
      dataSource.query.mockRejectedValue(dbError);

      const result = await (service as any).checkDatabase();

      expect(result).toEqual({
        status: 'unhealthy',
        error: 'Connection timeout',
      });
    });
  });

  describe('getMemoryUsage', () => {
    it('should return memory usage information', () => {
      const result = (service as any).getMemoryUsage();

      expect(result).toEqual({
        status: 'healthy',
        heap: {
          used: expect.any(Number),
          total: expect.any(Number),
        },
        system: {
          total: expect.any(Number),
          free: expect.any(Number),
          used: expect.any(Number),
        },
        rss: expect.any(Number),
        external: expect.any(Number),
      });
    });
  });
});
