import { Injectable, Logger, LoggerService } from '@nestjs/common';

export interface LogContext {
  userId?: string;
  requestId?: string;
  method?: string;
  url?: string;
  userAgent?: string;
  ip?: string;
  statusCode?: string;
  responseTime?: string;
  action?: string;
  event?: string;
  metric?: string;
  value?: string;
  unit?: string;
  details?: string;
  [key: string]: any;
}

@Injectable()
export class AppLogger implements LoggerService {
  private readonly logger = new Logger(AppLogger.name);
  private logContext: LogContext = {};

  setContext(context: LogContext) {
    this.logContext = { ...this.logContext, ...context };
  }

  clearContext() {
    this.logContext = {};
  }

  private formatMessage(message: string, context?: LogContext): string {
    const combinedContext = { ...this.logContext, ...context };
    const contextStr = Object.entries(combinedContext)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key}=${value}`)
      .join(' ');

    return contextStr ? `${message} | ${contextStr}` : message;
  }

  log(message: any, context?: string) {
    const contextObj = typeof context === 'string' ? { context } : {};
    this.logger.log(this.formatMessage(message, contextObj));
  }

  error(message: any, trace?: string, context?: string) {
    const contextObj = typeof context === 'string' ? { context } : {};
    this.logger.error(this.formatMessage(message, contextObj), trace);
  }

  warn(message: any, context?: string) {
    const contextObj = typeof context === 'string' ? { context } : {};
    this.logger.warn(this.formatMessage(message, contextObj));
  }

  debug(message: any, context?: string) {
    const contextObj = typeof context === 'string' ? { context } : {};
    this.logger.debug(this.formatMessage(message, contextObj));
  }

  verbose(message: any, context?: string) {
    const contextObj = typeof context === 'string' ? { context } : {};
    this.logger.verbose(this.formatMessage(message, contextObj));
  }

  // Custom logging methods with LogContext
  logWithContext(message: string, context?: LogContext) {
    this.logger.log(this.formatMessage(message, context));
  }

  errorWithContext(message: string, trace?: string, context?: LogContext) {
    this.logger.error(this.formatMessage(message, context), trace);
  }

  warnWithContext(message: string, context?: LogContext) {
    this.logger.warn(this.formatMessage(message, context));
  }

  debugWithContext(message: string, context?: LogContext) {
    this.logger.debug(this.formatMessage(message, context));
  }

  // Request logging methods
  logRequest(method: string, url: string, context?: LogContext) {
    this.logWithContext(`${method} ${url}`, { method, url, ...context });
  }

  logResponse(
    method: string,
    url: string,
    statusCode: number,
    responseTime: number,
    context?: LogContext,
  ) {
    this.logWithContext(`${method} ${url} ${statusCode} ${responseTime}ms`, {
      method,
      url,
      statusCode: statusCode.toString(),
      responseTime: `${responseTime}ms`,
      ...context,
    });
  }

  logError(error: Error, context?: LogContext) {
    this.errorWithContext(
      `${error.name}: ${error.message}`,
      error.stack,
      context,
    );
  }

  // Business logic logging
  logUserAction(action: string, userId: string, details?: any) {
    this.logWithContext(`User action: ${action}`, {
      userId,
      action,
      details: details ? JSON.stringify(details) : undefined,
    });
  }

  logSecurityEvent(event: string, userId?: string, ip?: string, details?: any) {
    this.warnWithContext(`Security event: ${event}`, {
      userId,
      ip,
      event,
      details: details ? JSON.stringify(details) : undefined,
    });
  }

  logPerformanceMetric(metric: string, value: number, unit: string = 'ms') {
    this.logWithContext(`Performance: ${metric} = ${value}${unit}`, {
      metric,
      value: value.toString(),
      unit,
    });
  }
}
