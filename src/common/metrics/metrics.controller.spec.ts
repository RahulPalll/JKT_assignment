import { Test, TestingModule } from '@nestjs/testing';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

describe('MetricsController', () => {
  let controller: MetricsController;

  const mockMetricsService = {
    getPrometheusMetrics: jest.fn(),
    getHealthMetrics: jest.fn(),
    recordMemoryUsage: jest.fn(),
    getCounter: jest.fn(),
    getHistogram: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetricsController],
      providers: [
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
      ],
    }).compile();

    controller = module.get<MetricsController>(MetricsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return prometheus metrics', () => {
    const mockMetrics = '# HELP test_counter\ntest_counter 42';
    mockMetricsService.getPrometheusMetrics.mockReturnValue(mockMetrics);

    const result = controller.getPrometheusMetrics();

    expect(result).toBe(mockMetrics);
    expect(mockMetricsService.getPrometheusMetrics).toHaveBeenCalled();
  });

  it('should return health metrics', () => {
    const mockHealth = { status: 'ok', uptime: 3600 };
    mockMetricsService.getHealthMetrics.mockReturnValue(mockHealth);

    const result = controller.getHealthMetrics();

    expect(result).toEqual(mockHealth);
    expect(mockMetricsService.recordMemoryUsage).toHaveBeenCalled();
    expect(mockMetricsService.getHealthMetrics).toHaveBeenCalled();
  });
});
