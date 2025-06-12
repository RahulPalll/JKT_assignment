import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { HealthCheckDto } from './dto/health.dto';

@Injectable()
export class HealthService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async getHealthStatus(): Promise<HealthCheckDto> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
    };
  }

  async getDetailedHealthStatus() {
    const startTime = Date.now();
    
    const [databaseStatus, memoryUsage] = await Promise.allSettled([
      this.checkDatabase(),
      this.getMemoryUsage(),
    ]);

    const responseTime = Date.now() - startTime;

    // Handle database status
    let databaseResult;
    if (databaseStatus.status === 'fulfilled') {
      const dbResult = databaseStatus.value;
      if (dbResult.status === 'unhealthy') {
        databaseResult = {
          status: 'error',
          message: dbResult.error || 'Database check failed',
        };
      } else {
        databaseResult = dbResult;
      }
    } else {
      databaseResult = {
        status: 'error',
        message: databaseStatus.reason?.message || 'Database check failed',
      };
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      responseTime,
      checks: {
        database: databaseResult,
        memory: memoryUsage.status === 'fulfilled' ? memoryUsage.value : {
          status: 'error',
          message: 'Memory check failed',
        },
      },
    };
  }

  async getReadinessStatus() {
    const databaseStatus = await this.checkDatabase();
    
    if (databaseStatus.status === 'unhealthy') {
      throw new Error('Application is not ready');
    }
    
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
    };
  }

  async getLivenessStatus() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      pid: process.pid,
    };
  }

  private async checkDatabase() {
    try {
      const startTime = Date.now();
      await this.dataSource.query('SELECT 1');
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime,
        connection: 'active',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
      };
    }
  }

  private getMemoryUsage() {
    const usage = process.memoryUsage();
    const totalMemory = require('os').totalmem();
    const freeMemory = require('os').freemem();
    
    return {
      status: 'healthy',
      heap: {
        used: Math.round(usage.heapUsed / 1024 / 1024),
        total: Math.round(usage.heapTotal / 1024 / 1024),
      },
      system: {
        total: Math.round(totalMemory / 1024 / 1024),
        free: Math.round(freeMemory / 1024 / 1024),
        used: Math.round((totalMemory - freeMemory) / 1024 / 1024),
      },
      rss: Math.round(usage.rss / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024),
    };
  }
}
