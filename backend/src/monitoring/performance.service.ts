import { Injectable, Logger } from '@nestjs/common';
import { performance } from 'perf_hooks';

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

@Injectable()
export class PerformanceService {
  private readonly logger = new Logger(PerformanceService.name);
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 1000; // 메모리 사용량 제한

  /**
   * 성능 측정 시작
   */
  startMeasurement(name: string): () => void {
    const startTime = performance.now();

    return (metadata?: Record<string, any>) => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.recordMetric({
        name,
        duration,
        timestamp: new Date(),
        metadata,
      });

      // 느린 작업 경고
      if (duration > 1000) {
        this.logger.warn(
          `Slow operation detected: ${name} took ${duration.toFixed(2)}ms`,
          {
            name,
            duration,
            metadata,
          },
        );
      }
    };
  }

  /**
   * 데코레이터를 통한 자동 성능 측정
   */
  measurePerformance(
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const endMeasurement = this.performanceService.startMeasurement(
        `${target.constructor.name}.${propertyName}`,
      );

      try {
        const result = await method.apply(this, args);
        endMeasurement({ success: true, argsCount: args.length });
        return result;
      } catch (error) {
        endMeasurement({ success: false, error: error.message });
        throw error;
      }
    };

    return descriptor;
  }

  /**
   * 메트릭 기록
   */
  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // 메모리 사용량 제한
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // 개발 환경에서 상세 로깅
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(
        `Performance: ${metric.name} - ${metric.duration.toFixed(2)}ms`,
      );
    }
  }

  /**
   * 성능 통계 조회
   */
  getPerformanceStats(timeRange?: { start: Date; end: Date }) {
    let filteredMetrics = this.metrics;

    if (timeRange) {
      filteredMetrics = this.metrics.filter(
        (metric) =>
          metric.timestamp >= timeRange.start &&
          metric.timestamp <= timeRange.end,
      );
    }

    const groupedMetrics = this.groupMetricsByName(filteredMetrics);

    return Object.entries(groupedMetrics).map(([name, metrics]) => ({
      name,
      count: metrics.length,
      avgDuration: this.calculateAverage(metrics.map((m) => m.duration)),
      minDuration: Math.min(...metrics.map((m) => m.duration)),
      maxDuration: Math.max(...metrics.map((m) => m.duration)),
      p95Duration: this.calculatePercentile(
        metrics.map((m) => m.duration),
        95,
      ),
      p99Duration: this.calculatePercentile(
        metrics.map((m) => m.duration),
        99,
      ),
    }));
  }

  /**
   * 느린 쿼리 조회
   */
  getSlowOperations(threshold: number = 1000) {
    return this.metrics
      .filter((metric) => metric.duration > threshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 50); // 상위 50개만
  }

  /**
   * 실시간 성능 모니터링
   */
  getRealtimeStats() {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const lastMinuteMetrics = this.metrics.filter(
      (m) => m.timestamp >= oneMinuteAgo,
    );
    const lastFiveMinutesMetrics = this.metrics.filter(
      (m) => m.timestamp >= fiveMinutesAgo,
    );

    return {
      lastMinute: {
        count: lastMinuteMetrics.length,
        avgDuration: this.calculateAverage(
          lastMinuteMetrics.map((m) => m.duration),
        ),
        slowOperations: lastMinuteMetrics.filter((m) => m.duration > 1000)
          .length,
      },
      lastFiveMinutes: {
        count: lastFiveMinutesMetrics.length,
        avgDuration: this.calculateAverage(
          lastFiveMinutesMetrics.map((m) => m.duration),
        ),
        slowOperations: lastFiveMinutesMetrics.filter((m) => m.duration > 1000)
          .length,
      },
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
    };
  }

  /**
   * 메트릭 초기화
   */
  clearMetrics(): void {
    this.metrics = [];
    this.logger.log('Performance metrics cleared');
  }

  /**
   * 헬퍼 메서드들
   */
  private groupMetricsByName(
    metrics: PerformanceMetric[],
  ): Record<string, PerformanceMetric[]> {
    return metrics.reduce(
      (groups, metric) => {
        const key = metric.name;
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(metric);
        return groups;
      },
      {} as Record<string, PerformanceMetric[]>,
    );
  }

  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  private calculatePercentile(numbers: number[], percentile: number): number {
    if (numbers.length === 0) return 0;

    const sorted = numbers.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }
}

/**
 * 성능 측정 데코레이터
 */
export function Measure(
  target: any,
  propertyName: string,
  descriptor: PropertyDescriptor,
) {
  const method = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const startTime = performance.now();
    const methodName = `${target.constructor.name}.${propertyName}`;

    try {
      const result = await method.apply(this, args);
      const duration = performance.now() - startTime;

      // 성능 서비스가 주입되어 있다면 기록
      if (this.performanceService) {
        this.performanceService.recordMetric({
          name: methodName,
          duration,
          timestamp: new Date(),
          metadata: { success: true, argsCount: args.length },
        });
      }

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;

      if (this.performanceService) {
        this.performanceService.recordMetric({
          name: methodName,
          duration,
          timestamp: new Date(),
          metadata: { success: false, error: error.message },
        });
      }

      throw error;
    }
  };

  return descriptor;
}

