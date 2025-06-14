import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MetricsService],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
    service.reset();
  });

  afterEach(() => {
    service.reset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('counter methods', () => {
    it('should increment counter', () => {
      service.incrementCounter('test_counter', { type: 'test' }, 1);

      const value = service.getCounter('test_counter', { type: 'test' });
      expect(value).toBe(1);
    });

    it('should increment counter multiple times', () => {
      service.incrementCounter('test_counter', { type: 'test' }, 1);
      service.incrementCounter('test_counter', { type: 'test' }, 2);

      const value = service.getCounter('test_counter', { type: 'test' });
      expect(value).toBe(3);
    });

    it('should return 0 for non-existent counter', () => {
      const value = service.getCounter('nonexistent');
      expect(value).toBe(0);
    });
  });

  describe('histogram methods', () => {
    it('should record histogram values', () => {
      service.recordHistogram('test_histogram', 100, { endpoint: '/users' });
      service.recordHistogram('test_histogram', 200, { endpoint: '/users' });

      const histogram = service.getHistogram('test_histogram', {
        endpoint: '/users',
      });
      expect(histogram).toBeDefined();
      expect(histogram!.count).toBe(2);
      expect(histogram!.sum).toBe(300);
    });

    it('should record histogram values for different endpoints', () => {
      service.recordHistogram('test_histogram', 100, { endpoint: '/users' });
      service.recordHistogram('test_histogram', 150, { endpoint: '/docs' });

      const usersHistogram = service.getHistogram('test_histogram', {
        endpoint: '/users',
      });
      const docsHistogram = service.getHistogram('test_histogram', {
        endpoint: '/docs',
      });

      expect(usersHistogram).toBeDefined();
      expect(usersHistogram!.count).toBe(1);
      expect(usersHistogram!.sum).toBe(100);
      expect(docsHistogram).toBeDefined();
      expect(docsHistogram!.count).toBe(1);
      expect(docsHistogram!.sum).toBe(150);
    });

    it('should return undefined for non-existent histogram', () => {
      const histogram = service.getHistogram('nonexistent');
      expect(histogram).toBeUndefined();
    });
  });

  describe('gauge methods', () => {
    it('should set gauge value', () => {
      service.setGauge('test_gauge', 42, { type: 'memory' });

      const value = service.getGauge('test_gauge', { type: 'memory' });
      expect(value).toBe(42);
    });

    it('should increment gauge', () => {
      service.setGauge('test_gauge', 10);
      service.incrementGauge('test_gauge', 5);

      const value = service.getGauge('test_gauge');
      expect(value).toBe(15);
    });

    it('should decrement gauge', () => {
      service.setGauge('test_gauge', 20);
      service.decrementGauge('test_gauge', 8);

      const value = service.getGauge('test_gauge');
      expect(value).toBe(12);
    });

    it('should return 0 for non-existent gauge', () => {
      const value = service.getGauge('nonexistent');
      expect(value).toBe(0);
    });
  });

  describe('business metrics', () => {
    it('should record API calls', () => {
      service.recordApiCall('/api/users', 'GET', 200, 150);

      const requestCount = service.getCounter('api_requests_total', {
        endpoint: '/api/users',
        method: 'GET',
        status_code: '200',
      });
      expect(requestCount).toBe(1);

      const histogram = service.getHistogram('api_request_duration_seconds', {
        endpoint: '/api/users',
        method: 'GET',
        status_code: '200',
      });
      expect(histogram).toBeDefined();
      expect(histogram!.count).toBe(1);
      expect(histogram!.sum).toBe(0.15); // Convert ms to seconds
    });

    it('should record user actions', () => {
      service.recordUserAction('login', 'user123');
      service.recordUserAction('logout', 'user456');

      const loginCount = service.getCounter('user_actions_total', {
        action: 'login',
        user_id: 'user123',
      });
      expect(loginCount).toBe(1);

      const logoutCount = service.getCounter('user_actions_total', {
        action: 'logout',
        user_id: 'user456',
      });
      expect(logoutCount).toBe(1);
    });

    it('should record database operations', () => {
      service.recordDatabaseOperation('SELECT', 'users', 25);
      service.recordDatabaseOperation('INSERT', 'documents', 50);

      const selectCount = service.getCounter('database_operations_total', {
        operation: 'SELECT',
        table: 'users',
      });
      expect(selectCount).toBe(1);

      const histogram = service.getHistogram(
        'database_operation_duration_seconds',
        {
          operation: 'SELECT',
          table: 'users',
        },
      );
      expect(histogram).toBeDefined();
      expect(histogram!.count).toBe(1);
    });

    it('should record file operations', () => {
      service.recordFileOperation('upload', 'pdf', 1024000);

      const uploadCount = service.getCounter('file_operations_total', {
        operation: 'upload',
        file_type: 'pdf',
      });
      expect(uploadCount).toBe(1);

      const sizeHistogram = service.getHistogram('file_size_bytes', {
        operation: 'upload',
        file_type: 'pdf',
      });
      expect(sizeHistogram).toBeDefined();
      expect(sizeHistogram!.sum).toBe(1024000);
    });

    it('should record auth events', () => {
      service.recordAuthEvent('login', true);
      service.recordAuthEvent('login', false);

      const successCount = service.getCounter('auth_events_total', {
        event: 'login',
        success: 'true',
      });
      expect(successCount).toBe(1);

      const failureCount = service.getCounter('auth_events_total', {
        event: 'login',
        success: 'false',
      });
      expect(failureCount).toBe(1);
    });
  });

  describe('system metrics', () => {
    it('should record memory usage', () => {
      service.recordMemoryUsage();

      const heapUsed = service.getGauge('nodejs_memory_heap_used_bytes');
      const heapTotal = service.getGauge('nodejs_memory_heap_total_bytes');
      const rss = service.getGauge('nodejs_memory_rss_bytes');

      expect(heapUsed).toBeGreaterThan(0);
      expect(heapTotal).toBeGreaterThan(0);
      expect(rss).toBeGreaterThan(0);
    });

    it('should record active connections', () => {
      service.recordActiveConnections(25);

      const connections = service.getGauge('active_connections');
      expect(connections).toBe(25);
    });

    it('should record cache hit rate', () => {
      service.recordCacheHitRate('redis', 80, 100);

      const hitRate = service.getGauge('cache_hit_rate', { service: 'redis' });
      expect(hitRate).toBe(0.8);

      const hits = service.getCounter('cache_operations_total', {
        service: 'redis',
        type: 'hit',
      });
      expect(hits).toBe(80);

      const misses = service.getCounter('cache_operations_total', {
        service: 'redis',
        type: 'miss',
      });
      expect(misses).toBe(20);
    });
  });

  describe('export methods', () => {
    it('should get metrics', () => {
      service.incrementCounter('test_counter');
      service.recordHistogram('test_histogram', 100);

      const metrics = service.getMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0]).toHaveProperty('name');
      expect(metrics[0]).toHaveProperty('value');
      expect(metrics[0]).toHaveProperty('timestamp');
    });

    it('should get prometheus metrics', () => {
      service.incrementCounter('test_counter', { type: 'test' });
      service.recordHistogram('test_histogram', 100, { endpoint: '/test' });
      service.setGauge('test_gauge', 42);

      const prometheus = service.getPrometheusMetrics();
      expect(prometheus).toContain('test_counter');
      expect(prometheus).toContain('test_histogram');
      expect(prometheus).toContain('test_gauge');
    });

    it('should get health metrics', () => {
      service.incrementCounter('test_counter');
      service.recordHistogram('test_histogram', 100);
      service.setGauge('test_gauge', 42);

      const health = service.getHealthMetrics();
      expect(health).toHaveProperty('counters');
      expect(health).toHaveProperty('histograms');
      expect(health).toHaveProperty('gauges');
      expect(health).toHaveProperty('system');
      expect(health.system).toHaveProperty('uptime');
      expect(health.system).toHaveProperty('memory');
      expect(health.system).toHaveProperty('cpu');
    });
  });

  describe('reset functionality', () => {
    it('should reset all metrics', () => {
      service.incrementCounter('test_counter');
      service.recordHistogram('test_histogram', 100);
      service.setGauge('test_gauge', 42);

      service.reset();

      expect(service.getCounter('test_counter')).toBe(0);
      expect(service.getHistogram('test_histogram')).toBeUndefined();
      expect(service.getGauge('test_gauge')).toBe(0);
      expect(service.getMetrics()).toHaveLength(0);
    });
  });
});
