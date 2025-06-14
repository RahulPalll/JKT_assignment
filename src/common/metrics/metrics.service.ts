import { Injectable } from '@nestjs/common';

interface Metric {
  name: string;
  value: number;
  timestamp: Date;
  labels?: Record<string, string>;
}

interface Counter {
  value: number;
  labels?: Record<string, string>;
}

interface Histogram {
  count: number;
  sum: number;
  buckets: Map<number, number>;
  labels?: Record<string, string>;
}

export interface HealthMetrics {
  counters: Record<string, Counter>;
  histograms: Record<string, any>;
  gauges: Record<string, number>;
  system: {
    uptime: number;
    memory: NodeJS.MemoryUsage;
    cpu: NodeJS.CpuUsage;
  };
}

@Injectable()
export class MetricsService {
  private counters: Map<string, Counter> = new Map();
  private histograms: Map<string, Histogram> = new Map();
  private gauges: Map<string, number> = new Map();
  private metrics: Metric[] = [];

  // Counter methods
  incrementCounter(
    name: string,
    labels?: Record<string, string>,
    value: number = 1,
  ) {
    const key = this.getKey(name, labels);
    const existing = this.counters.get(key);

    if (existing) {
      existing.value += value;
    } else {
      this.counters.set(key, { value, labels });
    }

    this.recordMetric(name, value, labels);
  }

  getCounter(name: string, labels?: Record<string, string>): number {
    const key = this.getKey(name, labels);
    return this.counters.get(key)?.value || 0;
  }

  // Histogram methods
  recordHistogram(
    name: string,
    value: number,
    labels?: Record<string, string>,
  ) {
    const key = this.getKey(name, labels);
    let histogram = this.histograms.get(key);

    if (!histogram) {
      histogram = {
        count: 0,
        sum: 0,
        buckets: new Map(),
        labels,
      };
      this.histograms.set(key, histogram);
    }

    histogram.count++;
    histogram.sum += value;

    // Update buckets (with standard buckets: 0.1, 0.5, 1, 2.5, 5, 10, +Inf)
    const buckets = [0.1, 0.5, 1, 2.5, 5, 10, Infinity];
    for (const bucket of buckets) {
      if (value <= bucket) {
        const currentCount = histogram.buckets.get(bucket) || 0;
        histogram.buckets.set(bucket, currentCount + 1);
      }
    }

    this.recordMetric(name, value, labels);
  }

  getHistogram(
    name: string,
    labels?: Record<string, string>,
  ): Histogram | undefined {
    const key = this.getKey(name, labels);
    return this.histograms.get(key);
  }

  // Gauge methods
  setGauge(name: string, value: number, labels?: Record<string, string>) {
    const key = this.getKey(name, labels);
    this.gauges.set(key, value);
    this.recordMetric(name, value, labels);
  }

  incrementGauge(
    name: string,
    value: number = 1,
    labels?: Record<string, string>,
  ) {
    const key = this.getKey(name, labels);
    const current = this.gauges.get(key) || 0;
    this.setGauge(name, current + value, labels);
  }

  decrementGauge(
    name: string,
    value: number = 1,
    labels?: Record<string, string>,
  ) {
    const key = this.getKey(name, labels);
    const current = this.gauges.get(key) || 0;
    this.setGauge(name, current - value, labels);
  }

  getGauge(name: string, labels?: Record<string, string>): number {
    const key = this.getKey(name, labels);
    return this.gauges.get(key) || 0;
  }

  // Business metrics
  recordApiCall(
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number,
  ) {
    const labels = { endpoint, method, status_code: statusCode.toString() };

    this.incrementCounter('api_requests_total', labels);
    this.recordHistogram(
      'api_request_duration_seconds',
      duration / 1000,
      labels,
    );

    if (statusCode >= 400) {
      this.incrementCounter('api_errors_total', labels);
    }
  }

  recordUserAction(action: string, userId: string) {
    this.incrementCounter('user_actions_total', { action, user_id: userId });
  }

  recordDatabaseOperation(operation: string, table: string, duration: number) {
    const labels = { operation, table };
    this.incrementCounter('database_operations_total', labels);
    this.recordHistogram(
      'database_operation_duration_seconds',
      duration / 1000,
      labels,
    );
  }

  recordFileOperation(operation: string, fileType: string, size?: number) {
    const labels = { operation, file_type: fileType };
    this.incrementCounter('file_operations_total', labels);

    if (size) {
      this.recordHistogram('file_size_bytes', size, labels);
    }
  }

  recordAuthEvent(event: string, success: boolean) {
    const labels = { event, success: success.toString() };
    this.incrementCounter('auth_events_total', labels);
  }

  // System metrics
  recordMemoryUsage() {
    const usage = process.memoryUsage();
    this.setGauge('nodejs_memory_heap_used_bytes', usage.heapUsed);
    this.setGauge('nodejs_memory_heap_total_bytes', usage.heapTotal);
    this.setGauge('nodejs_memory_rss_bytes', usage.rss);
    this.setGauge('nodejs_memory_external_bytes', usage.external);
  }

  recordActiveConnections(count: number) {
    this.setGauge('active_connections', count);
  }

  recordCacheHitRate(service: string, hits: number, total: number) {
    const hitRate = total > 0 ? hits / total : 0;
    this.setGauge('cache_hit_rate', hitRate, { service });
    this.incrementCounter(
      'cache_operations_total',
      { service, type: 'hit' },
      hits,
    );
    this.incrementCounter(
      'cache_operations_total',
      { service, type: 'miss' },
      total - hits,
    );
  }

  // Export methods
  getMetrics(): Metric[] {
    return [...this.metrics];
  }

  getPrometheusMetrics(): string {
    let output = '';

    // Counters
    for (const [key, counter] of this.counters) {
      const [name] = key.split('|');
      const labels = this.formatLabels(counter.labels);
      output += `# TYPE ${name} counter\n`;
      output += `${name}${labels} ${counter.value}\n`;
    }

    // Histograms
    for (const [key, histogram] of this.histograms) {
      const [name] = key.split('|');
      const labels = this.formatLabels(histogram.labels);

      output += `# TYPE ${name} histogram\n`;
      output += `${name}_count${labels} ${histogram.count}\n`;
      output += `${name}_sum${labels} ${histogram.sum}\n`;

      for (const [bucket, count] of histogram.buckets) {
        const bucketLabel = bucket === Infinity ? '+Inf' : bucket.toString();
        const bucketLabels = this.formatLabels({
          ...histogram.labels,
          le: bucketLabel,
        });
        output += `${name}_bucket${bucketLabels} ${count}\n`;
      }
    }

    // Gauges
    for (const [key, value] of this.gauges) {
      const [name, labelStr] = key.split('|');
      const labels = labelStr ? this.parseLabels(labelStr) : undefined;
      output += `# TYPE ${name} gauge\n`;
      output += `${name}${this.formatLabels(labels)} ${value}\n`;
    }

    return output;
  }

  getHealthMetrics(): HealthMetrics {
    return {
      counters: Object.fromEntries(this.counters),
      histograms: Object.fromEntries(
        Array.from(this.histograms.entries()).map(([key, hist]) => [
          key,
          {
            count: hist.count,
            sum: hist.sum,
            average: hist.count > 0 ? hist.sum / hist.count : 0,
            buckets: Object.fromEntries(hist.buckets),
          },
        ]),
      ),
      gauges: Object.fromEntries(this.gauges),
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
      },
    };
  }

  // Utility methods
  private recordMetric(
    name: string,
    value: number,
    labels?: Record<string, string>,
  ) {
    this.metrics.push({
      name,
      value,
      timestamp: new Date(),
      labels,
    });

    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  private getKey(name: string, labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }

    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}="${value}"`)
      .join(',');

    return `${name}|${labelStr}`;
  }

  private formatLabels(labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return '';
    }

    const labelStr = Object.entries(labels)
      .map(([key, value]) => `${key}="${value}"`)
      .join(',');

    return `{${labelStr}}`;
  }

  private parseLabels(labelStr: string): Record<string, string> {
    const labels: Record<string, string> = {};
    const pairs = labelStr.split(',');

    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key && value) {
        labels[key] = value.replace(/"/g, '');
      }
    }

    return labels;
  }

  // Reset methods (useful for testing)
  reset() {
    this.counters.clear();
    this.histograms.clear();
    this.gauges.clear();
    this.metrics = [];
  }
}
