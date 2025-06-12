import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { HealthCheckDto } from './dto/health.dto';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({
    status: 200,
    description: 'Application is healthy',
    type: HealthCheckDto,
  })
  async check(): Promise<HealthCheckDto> {
    return this.healthService.getHealthStatus();
  }

  @Get('detailed')
  @ApiOperation({ summary: 'Detailed health check with dependencies' })
  @ApiResponse({
    status: 200,
    description: 'Detailed health status',
  })
  async detailedCheck() {
    return this.healthService.getDetailedHealthStatus();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe for Kubernetes' })
  @ApiResponse({
    status: 200,
    description: 'Application is ready to serve traffic',
  })
  async readiness() {
    return this.healthService.getReadinessStatus();
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe for Kubernetes' })
  @ApiResponse({
    status: 200,
    description: 'Application is alive',
  })
  async liveness() {
    return this.healthService.getLivenessStatus();
  }
}
