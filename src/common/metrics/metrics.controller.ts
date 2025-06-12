import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { MetricsService, HealthMetrics } from './metrics.service';

@ApiTags('Monitoring')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @ApiExcludeEndpoint()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  getPrometheusMetrics(): string {
    return this.metricsService.getPrometheusMetrics();
  }

  @Get('health')
  @ApiOperation({ summary: 'Get application health metrics' })
  @ApiResponse({
    status: 200,
    description: 'Health metrics',
    schema: {
      type: 'object',
      properties: {
        counters: { type: 'object' },
        histograms: { type: 'object' },
        gauges: { type: 'object' },
        system: { type: 'object' }
      }
    }
  })
  getHealthMetrics(): HealthMetrics {
    // Update system metrics before returning
    this.metricsService.recordMemoryUsage();
    return this.metricsService.getHealthMetrics();
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get metrics summary' })
  @ApiResponse({
    status: 200,
    description: 'Metrics summary',
  })
  getMetricsSummary() {
    const health = this.metricsService.getHealthMetrics();
    
    return {
      api: {
        totalRequests: this.metricsService.getCounter('api_requests_total'),
        totalErrors: this.metricsService.getCounter('api_errors_total'),
        errorRate: this.calculateErrorRate(),
        averageResponseTime: this.calculateAverageResponseTime()
      },
      auth: {
        totalLoginAttempts: this.metricsService.getCounter('auth_events_total', { event: 'login' }),
        successfulLogins: this.metricsService.getCounter('auth_events_total', { event: 'login', success: 'true' }),
        failedLogins: this.metricsService.getCounter('auth_events_total', { event: 'login', success: 'false' })
      },
      database: {
        totalOperations: this.metricsService.getCounter('database_operations_total'),
        averageOperationTime: this.calculateAverageDatabaseTime()
      },
      files: {
        totalOperations: this.metricsService.getCounter('file_operations_total'),
        uploads: this.metricsService.getCounter('file_operations_total', { operation: 'upload' }),
        downloads: this.metricsService.getCounter('file_operations_total', { operation: 'download' })
      },
      system: health.system
    };
  }

  private calculateErrorRate(): number {
    const totalRequests = this.metricsService.getCounter('api_requests_total');
    const totalErrors = this.metricsService.getCounter('api_errors_total');
    
    return totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
  }

  private calculateAverageResponseTime(): number {
    const histogram = this.metricsService.getHistogram('api_request_duration_seconds');
    return histogram && histogram.count > 0 ? histogram.sum / histogram.count : 0;
  }

  private calculateAverageDatabaseTime(): number {
    const histogram = this.metricsService.getHistogram('database_operation_duration_seconds');
    return histogram && histogram.count > 0 ? histogram.sum / histogram.count : 0;
  }
}
