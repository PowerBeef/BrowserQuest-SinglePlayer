/**
 * Memory Manager
 * Advanced memory management for touch controls
 */

import { PerformanceMetrics } from '../types/TouchTypes';

interface MemoryConfig {
  maxMemoryUsage: number; // MB
  gcThreshold: number; // MB
  gcInterval: number; // ms
  enableMemoryMonitoring: boolean;
  enableAutomaticGC: boolean;
  enableMemoryPooling: boolean;
  poolSize: number;
}

interface MemoryStats {
  used: number;
  total: number;
  available: number;
  usage: number; // percentage
  gcCount: number;
  lastGCTime: number;
}

export class MemoryManager {
  private config: MemoryConfig;
  private memoryStats: MemoryStats;
  private gcInterval: NodeJS.Timeout | null = null;
  private isMonitoring: boolean = false;
  private memoryObjects: WeakMap<any, number> = new WeakMap();
  private objectPool: any[] = [];
  private performanceMetrics: PerformanceMetrics | null = null;

  constructor(config: Partial<MemoryConfig> = {}) {
    this.config = {
      maxMemoryUsage: 50, // 50MB
      gcThreshold: 40, // 40MB
      gcInterval: 30000, // 30 seconds
      enableMemoryMonitoring: true,
      enableAutomaticGC: true,
      enableMemoryPooling: true,
      poolSize: 100,
      ...config
    };

    this.memoryStats = {
      used: 0,
      total: 0,
      available: 0,
      usage: 0,
      gcCount: 0,
      lastGCTime: 0
    };

    this.initializeObjectPool();
    this.startMemoryMonitoring();
  }

  /**
   * Initialize object pool for memory reuse
   */
  private initializeObjectPool(): void {
    if (this.config.enableMemoryPooling) {
      for (let i = 0; i < this.config.poolSize; i++) {
        this.objectPool.push(this.createPooledObject());
      }
    }
  }

  /**
   * Create a pooled object
   */
  private createPooledObject(): any {
    return {
      id: Math.random().toString(36).substr(2, 9),
      data: null,
      timestamp: Date.now(),
      reset: function() {
        this.data = null;
        this.timestamp = Date.now();
      }
    };
  }

  /**
   * Get object from pool
   */
  public getPooledObject(): any {
    if (this.config.enableMemoryPooling && this.objectPool.length > 0) {
      return this.objectPool.pop();
    }
    return this.createPooledObject();
  }

  /**
   * Return object to pool
   */
  public returnPooledObject(obj: any): void {
    if (this.config.enableMemoryPooling && this.objectPool.length < this.config.poolSize) {
      if (obj.reset) {
        obj.reset();
      }
      this.objectPool.push(obj);
    }
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    if (!this.config.enableMemoryMonitoring) return;

    this.isMonitoring = true;
    this.gcInterval = setInterval(() => {
      this.updateMemoryStats();
      this.checkMemoryThreshold();
    }, 1000); // Check every second
  }

  /**
   * Stop memory monitoring
   */
  private stopMemoryMonitoring(): void {
    this.isMonitoring = false;
    if (this.gcInterval) {
      clearInterval(this.gcInterval);
      this.gcInterval = null;
    }
  }

  /**
   * Update memory statistics
   */
  private updateMemoryStats(): void {
    if (typeof performance !== 'undefined' && performance.memory) {
      const memory = performance.memory;
      this.memoryStats.used = memory.usedJSHeapSize / 1024 / 1024; // MB
      this.memoryStats.total = memory.totalJSHeapSize / 1024 / 1024; // MB
      this.memoryStats.available = this.memoryStats.total - this.memoryStats.used;
      this.memoryStats.usage = (this.memoryStats.used / this.memoryStats.total) * 100;
    } else {
      // Fallback for environments without performance.memory
      this.memoryStats.used = this.estimateMemoryUsage();
      this.memoryStats.total = this.config.maxMemoryUsage;
      this.memoryStats.available = this.memoryStats.total - this.memoryStats.used;
      this.memoryStats.usage = (this.memoryStats.used / this.memoryStats.total) * 100;
    }
  }

  /**
   * Estimate memory usage (fallback method)
   */
  private estimateMemoryUsage(): number {
    // Simple estimation based on object count and average size
    const objectCount = this.objectPool.length;
    const averageObjectSize = 0.001; // 1KB per object (rough estimate)
    return objectCount * averageObjectSize;
  }

  /**
   * Check memory threshold and trigger GC if needed
   */
  private checkMemoryThreshold(): void {
    if (this.config.enableAutomaticGC && this.memoryStats.used > this.config.gcThreshold) {
      this.performGarbageCollection();
    }
  }

  /**
   * Perform garbage collection
   */
  public performGarbageCollection(): void {
    const startTime = Date.now();
    
    // Clear object pool if memory usage is high
    if (this.memoryStats.usage > 80) {
      this.objectPool.length = Math.floor(this.objectPool.length * 0.5);
    }

    // Force garbage collection if available
    if (typeof global !== 'undefined' && global.gc) {
      global.gc();
    }

    this.memoryStats.gcCount++;
    this.memoryStats.lastGCTime = Date.now() - startTime;

    console.log(`Garbage collection completed in ${this.memoryStats.lastGCTime}ms`);
  }

  /**
   * Track memory object
   */
  public trackObject(obj: any, size: number = 0): void {
    this.memoryObjects.set(obj, size);
  }

  /**
   * Untrack memory object
   */
  public untrackObject(obj: any): void {
    this.memoryObjects.delete(obj);
  }

  /**
   * Get memory statistics
   */
  public getMemoryStats(): MemoryStats {
    return { ...this.memoryStats };
  }

  /**
   * Check if memory usage is within limits
   */
  public isMemoryUsageAcceptable(): boolean {
    return this.memoryStats.used < this.config.maxMemoryUsage;
  }

  /**
   * Get memory usage percentage
   */
  public getMemoryUsagePercentage(): number {
    return this.memoryStats.usage;
  }

  /**
   * Get available memory
   */
  public getAvailableMemory(): number {
    return this.memoryStats.available;
  }

  /**
   * Check if memory is low
   */
  public isMemoryLow(): boolean {
    return this.memoryStats.usage > 80; // 80% threshold
  }

  /**
   * Check if memory is critically low
   */
  public isMemoryCritical(): boolean {
    return this.memoryStats.usage > 95; // 95% threshold
  }

  /**
   * Get memory recommendations
   */
  public getMemoryRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.memoryStats.usage > 90) {
      recommendations.push('Memory usage is critically high. Consider reducing cache sizes.');
      recommendations.push('Enable aggressive garbage collection.');
    } else if (this.memoryStats.usage > 80) {
      recommendations.push('Memory usage is high. Consider optimizing memory usage.');
      recommendations.push('Reduce object pool size if not needed.');
    } else if (this.memoryStats.usage > 70) {
      recommendations.push('Memory usage is moderate. Monitor for potential issues.');
    }

    if (this.memoryStats.gcCount > 10) {
      recommendations.push('Frequent garbage collection detected. Consider memory optimization.');
    }

    return recommendations;
  }

  /**
   * Optimize memory based on performance metrics
   */
  public optimizeMemory(metrics: PerformanceMetrics): void {
    this.performanceMetrics = metrics;

    // Adjust memory thresholds based on performance
    if (metrics.memoryUsage > 40) {
      this.config.gcThreshold = Math.max(20, this.config.gcThreshold * 0.9);
    } else if (metrics.memoryUsage < 20) {
      this.config.gcThreshold = Math.min(50, this.config.gcThreshold * 1.1);
    }

    // Adjust pool size based on memory usage
    if (this.memoryStats.usage > 80) {
      this.config.poolSize = Math.max(50, this.config.poolSize * 0.8);
    } else if (this.memoryStats.usage < 50) {
      this.config.poolSize = Math.min(200, this.config.poolSize * 1.2);
    }
  }

  /**
   * Create memory-efficient array
   */
  public createEfficientArray<T>(initialSize: number = 0): T[] {
    const array: T[] = [];
    if (initialSize > 0) {
      array.length = initialSize;
    }
    return array;
  }

  /**
   * Create memory-efficient object
   */
  public createEfficientObject(): any {
    const obj = Object.create(null); // No prototype for efficiency
    return obj;
  }

  /**
   * Clear memory-efficient array
   */
  public clearEfficientArray<T>(array: T[]): void {
    array.length = 0;
  }

  /**
   * Update memory configuration
   */
  public updateConfig(newConfig: Partial<MemoryConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Restart monitoring if interval changed
    if (newConfig.gcInterval) {
      this.stopMemoryMonitoring();
      this.startMemoryMonitoring();
    }

    // Adjust pool size if changed
    if (newConfig.poolSize) {
      const currentSize = this.objectPool.length;
      const targetSize = newConfig.poolSize;

      if (targetSize > currentSize) {
        // Add more objects to pool
        for (let i = currentSize; i < targetSize; i++) {
          this.objectPool.push(this.createPooledObject());
        }
      } else if (targetSize < currentSize) {
        // Remove objects from pool
        this.objectPool.splice(targetSize);
      }
    }
  }

  /**
   * Get memory configuration
   */
  public getConfig(): MemoryConfig {
    return { ...this.config };
  }

  /**
   * Reset memory manager
   */
  public reset(): void {
    this.objectPool = [];
    this.memoryStats = {
      used: 0,
      total: 0,
      available: 0,
      usage: 0,
      gcCount: 0,
      lastGCTime: 0
    };
    this.initializeObjectPool();
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.stopMemoryMonitoring();
    this.objectPool = [];
    this.memoryObjects = new WeakMap();
    this.performanceMetrics = null;
  }
}