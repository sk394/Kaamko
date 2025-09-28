interface PerformanceMetrics {
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryUsage?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 50; // Limit stored metrics to prevent memory bloat

  /**
   * Start timing an operation
   * @param operation - Name of the operation being timed
   * @returns Metric ID for stopping the timer
   */
  startTiming(operation: string): number {
    const metric: PerformanceMetrics = {
      operation,
      startTime: Date.now(),
    };

    this.metrics.push(metric);

    // Keep only the most recent metrics to prevent memory growth
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    return this.metrics.length - 1;
  }

  /**
   * Stop timing an operation
   * @param metricId - ID returned from startTiming
   */
  stopTiming(metricId: number): void {
    if (metricId >= 0 && metricId < this.metrics.length) {
      const metric = this.metrics[metricId];
      metric.endTime = Date.now();
      metric.duration = metric.endTime - metric.startTime;

      // Log slow operations in development
      if (__DEV__ && metric.duration > 1000) {
        console.warn(
          `Slow operation detected: ${metric.operation} took ${metric.duration}ms`
        );
      }
    }
  }

  /**
   * Get performance summary for debugging
   */
  getSummary(): { operation: string; avgDuration: number; count: number }[] {
    const operationStats: { [key: string]: { total: number; count: number } } =
      {};

    this.metrics
      .filter((m) => m.duration !== undefined)
      .forEach((metric) => {
        if (!operationStats[metric.operation]) {
          operationStats[metric.operation] = { total: 0, count: 0 };
        }
        operationStats[metric.operation].total += metric.duration!;
        operationStats[metric.operation].count += 1;
      });

    return Object.entries(operationStats).map(([operation, stats]) => ({
      operation,
      avgDuration: Math.round(stats.total / stats.count),
      count: stats.count,
    }));
  }

  /**
   * Clear all stored metrics
   */
  clear(): void {
    this.metrics = [];
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator function to automatically time async operations
 * @param operation - Name of the operation
 * @param fn - Async function to time
 */
export const timeAsyncOperation = async <T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> => {
  const metricId = performanceMonitor.startTiming(operation);
  try {
    const result = await fn();
    return result;
  } finally {
    performanceMonitor.stopTiming(metricId);
  }
};

/**
 * Memory usage monitoring (development only)
 */
export const logMemoryUsage = (context: string): void => {
  if (__DEV__) {
    // Note: React Native doesn't have performance.memory like web browsers
    // This is a placeholder for potential native memory monitoring
    console.log(`Memory check at ${context}: ${Date.now()}`);
  }
};
