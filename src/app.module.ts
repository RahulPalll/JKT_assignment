import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DocumentsModule } from './documents/documents.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './common/metrics/metrics.module';
import { AppLogger } from './common/logger/app-logger.service';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService) => ({
        ...configService.get('database'),
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    DocumentsModule,
    IngestionModule,
    HealthModule,
    MetricsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AppLogger,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
