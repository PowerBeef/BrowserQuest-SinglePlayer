/**
 * Performance Monitor
 * Tracks and optimizes touch control performance metrics
 */

import { 
  PerformanceMetrics, 
  GestureType 
} from '../types/TouchTypes';

interface TimingData {
  startTime: number;
  endTime?: number;
  duration?: number;
}

interface GestureMetrics {
  count: number;
  successCount: number;
  errorCount: number;
  averageTime: number;
  totalTime: number;
}

export class PerformanceMonitor {
  private timings: Map<string, TimingData> = new Map();
  private gestureMetrics: Map<GestureType, GestureMetrics> = new Map();
  private memoryUsage: number = 0;
  private batteryImpact: number = 0;
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeGestureMetrics();
    this.startMonitoring();
  }

  /**
   * Initialize gesture metrics tracking
   */
  private initializeGestureMetrics(): void {
    Object.values(GestureType).forEach(gestureType => {
      this.gestureMetrics.set(gestureType, {
        count: 0,
        successCount: 0,
        errorCount: 0,
        averageTime: 0,
        totalTime: 0
      });
    });
  }

  /**
   * Start performance monitoring
   */
  private startMonitoring(): void {
    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.updateMemoryUsage();
      this.updateBatteryImpact();
    }, 1000); // Update every second
  }

  /**
   * Stop performance monitoring
   */
  private stopMonitoring(): void {
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Start timing a specific operation
   */
  public startTiming(operation: string): number {
    const startTime = performance.now();
    this.timings.set(operation, { startTime });
    return startTime;
  }

  /**
   * End timing for a specific operation
   */
  public endTiming(operation: string, startTime?: number): number {
    const endTime = performance.now();
    const timing = this.timings.get(operation);
    
    if (timing) {
      timing.endTime = endTime;
      timing.duration = endTime - timing.startTime;
    } else if (startTime) {
      this.timings.set(operation, {
        startTime,
        endTime,
        duration: endTime - startTime
      });
    }

    return endTime;
  }

  /**
   * Record gesture recognition
   */
  public recordGesture(gestureType: GestureType, success: boolean, recognitionTime?: number): void {
    const metrics = this.gestureMetrics.get(gestureType);
    if (!metrics) return;

    metrics.count++;
    if (success) {
      metrics.successCount++;
    } else {
      metrics.errorCount++;
    }

    if (recognitionTime) {
      metrics.totalTime += recognitionTime;
      metrics.averageTime = metrics.totalTime / metrics.count;
    }
  }

  /**
   * Update memory usage
   */
  private updateMemoryUsage(): void {
    // This would typically use platform-specific APIs
    // For now, we'll simulate memory usage tracking
    if (typeof performance !== 'undefined' && performance.memory) {
      this.memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
    }
  }

  /**
   * Update battery impact
   */
  private updateBatteryImpact(): void {
    // This would typically use platform-specific battery APIs
    // For now, we'll estimate based on CPU usage
    const cpuUsage = this.calculateCPUUsage();
    this.batteryImpact = cpuUsage * 0.1; // Estimate battery impact
  }

  /**
   * Calculate CPU usage (simplified)
   */
  private calculateCPUUsage(): number {
    // This is a simplified calculation
    // In a real implementation, you'd use platform-specific APIs
    const activeGestures = Array.from(this.gestureMetrics.values())
      .reduce((sum, metrics) => sum + metrics.count, 0);
    
    return Math.min(activeGestures * 0.01, 1.0); // Cap at 100%
  }

  /**
   * Get performance metrics
   */
  public getMetrics(): PerformanceMetrics {
    const totalGestures = Array.from(this.gestureMetrics.values())
      .reduce((sum, metrics) => sum + metrics.count, 0);
    
    const successfulGestures = Array.from(this.gestureMetrics.values())
      .reduce((sum, metrics) => sum + metrics.successCount, 0);

    const averageRecognitionTime = Array.from(this.gestureMetrics.values())
      .reduce((sum, metrics) => sum + metrics.averageTime, 0) / this.gestureMetrics.size;

    return {
      gestureRecognitionTime: averageRecognitionTime,
      memoryUsage: this.memoryUsage,
      batteryImpact: this.batteryImpact,
      errorRate: totalGestures > 0 ? (totalGestures - successfulGestures) / totalGestures : 0,
      successRate: totalGestures > 0 ? successfulGestures / totalGestures : 1
    };
  }

  /**
   * Get detailed metrics for specific gesture type
   */
  public getGestureMetrics(gestureType: GestureType): GestureMetrics | null {
    return this.gestureMetrics.get(gestureType) || null;
  }

  /**
   * Get timing data for specific operation
   */
  public getTiming(operation: string): TimingData | null {
    return this.timings.get(operation) || null;
  }

  /**
   * Get all timing data
   */
  public getAllTimings(): Map<string, TimingData> {
    return new Map(this.timings);
  }

  /**
   * Check if performance is within acceptable limits
   */
  public isPerformanceAcceptable(): boolean {
    const metrics = this.getMetrics();
    
    return (
      metrics.gestureRecognitionTime < 100 && // < 100ms
      metrics.memoryUsage < 50 && // < 50MB
      metrics.batteryImpact < 0.05 && // < 5%
      metrics.errorRate < 0.05 // < 5% error rate
    );
  }

  /**
   * Get performance recommendations
   */
  public getPerformanceRecommendations(): string[] {
    const recommendations: string[] = [];
    const metrics = this.getMetrics();

    if (metrics.gestureRecognitionTime > 100) {
      recommendations.push('Gesture recognition time is too high. Consider optimizing gesture algorithms.');
    }

    if (metrics.memoryUsage > 50) {
      recommendations.push('Memory usage is high. Consider implementing memory cleanup strategies.');
    }

    if (metrics.batteryImpact > 0.05) {
      recommendations.push('Battery impact is significant. Consider reducing gesture processing frequency.');
    }

    if (metrics.errorRate > 0.05) {
      recommendations.push('Error rate is high. Consider improving gesture recognition accuracy.');
    }

    return recommendations;
  }

  /**
   * Reset all metrics
   */
  public reset(): void {
    this.timings.clear();
    this.initializeGestureMetrics();
    this.memoryUsage = 0;
    this.batteryImpact = 0;
  }

  /**
   * Export metrics data
   */
  public exportMetrics(): any {
    return {
      metrics: this.getMetrics(),
      gestureMetrics: Object.fromEntries(this.gestureMetrics),
      timings: Object.fromEntries(this.timings),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Import metrics data
   */
  public importMetrics(data: any): void {
    if (data.metrics) {
      // Import basic metrics
    }
    
    if (data.gestureMetrics) {
      // Import gesture-specific metrics
      Object.entries(data.gestureMetrics).forEach(([gestureType, metrics]) => {
        this.gestureMetrics.set(gestureType as GestureType, metrics as GestureMetrics);
      });
    }
    
    if (data.timings) {
      // Import timing data
      Object.entries(data.timings).forEach(([operation, timing]) => {
        this.timings.set(operation, timing as TimingData);
      });
    }
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.stopMonitoring();
    this.timings.clear();
    this.gestureMetrics.clear();
  }
}