import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { AppLogger } from '../logger/app-logger.service';
import { JwtPayload } from '../interfaces';
import { v4 as uuidv4 } from 'uuid';

interface RequestWithUser extends Request {
  user?: JwtPayload;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly appLogger: AppLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<RequestWithUser>();
    const response = ctx.getResponse<Response>();

    const { method, url, headers, ip } = request;
    const userAgent = headers['user-agent'] || '';
    const requestId = uuidv4();
    const startTime = Date.now();

    // Add request ID to request for tracing
    request['requestId'] = requestId;

    // Set logging context
    const logContext = {
      requestId,
      method,
      url,
      userAgent,
      ip,
      userId: request.user?.sub,
    };

    this.appLogger.setContext(logContext);
    this.appLogger.logRequest(method, url, logContext);

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - startTime;
        this.appLogger.logResponse(
          method,
          url,
          response.statusCode,
          responseTime,
          logContext,
        );

        // Log performance metrics for slow requests
        if (responseTime > 1000) {
          this.appLogger.logPerformanceMetric(
            'slow_request',
            responseTime,
            'ms',
          );
        }
      }),
      catchError((error) => {
        const responseTime = Date.now() - startTime;
        this.appLogger.logError(error, {
          ...logContext,
          responseTime: `${responseTime}ms`,
        });
        throw error;
      }),
    );
  }
}
