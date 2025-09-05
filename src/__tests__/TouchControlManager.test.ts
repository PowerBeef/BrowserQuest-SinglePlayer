/**
 * Tests for TouchControlManager
 */

import { TouchControlManager } from '../core/TouchControlManager';
import { TouchControlConfig, TouchPoint, GestureType, TouchTarget } from '../types/TouchTypes';

describe('TouchControlManager', () => {
  let touchControlManager: TouchControlManager;
  let mockConfig: TouchControlConfig;

  beforeEach(() => {
    mockConfig = {
      platform: 'ios',
      minTouchTargetSize: 44,
      maxTouchTargetSize: 88,
      spacingBetweenTargets: 8,
      gestureConfig: {
        minDistance: 10,
        maxDistance: 1000,
        minDuration: 100,
        maxDuration: 2000,
        velocityThreshold: 0.3,
        scaleThreshold: 0.1,
        rotationThreshold: 15
      },
      accessibility: {
        screenReaderEnabled: false,
        voiceControlEnabled: false,
        switchControlEnabled: false,
        highContrastEnabled: false,
        reducedMotionEnabled: false,
        largeTextEnabled: false
      },
      performance: {
        maxRecognitionTime: 100,
        maxMemoryUsage: 50,
        enableCaching: true,
        enableOptimization: true
      }
    };

    touchControlManager = new TouchControlManager(mockConfig);
  });

  afterEach(() => {
    touchControlManager.destroy();
  });

  describe('Touch Target Management', () => {
    it('should register touch targets', () => {
      const target: TouchTarget = {
        id: 'test-target',
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        minSize: 44,
        accessibilityLabel: 'Test Target',
        accessibilityRole: 'button'
      };

      expect(() => touchControlManager.registerTouchTarget(target)).not.toThrow();
    });

    it('should unregister touch targets', () => {
      const target: TouchTarget = {
        id: 'test-target',
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        minSize: 44,
        accessibilityLabel: 'Test Target',
        accessibilityRole: 'button'
      };

      touchControlManager.registerTouchTarget(target);
      expect(() => touchControlManager.unregisterTouchTarget('test-target')).not.toThrow();
    });

    it('should validate touch target size', () => {
      const smallTarget: TouchTarget = {
        id: 'small-target',
        x: 0,
        y: 0,
        width: 20,
        height: 20,
        minSize: 20,
        accessibilityLabel: 'Small Target',
        accessibilityRole: 'button'
      };

      // Should warn about small target size
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      touchControlManager.registerTouchTarget(smallTarget);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Touch target small-target is below minimum size requirement')
      );
      consoleSpy.mockRestore();
    });
  });

  describe('Touch Event Handling', () => {
    it('should handle touch start events', () => {
      const touch: TouchPoint = {
        x: 100,
        y: 100,
        timestamp: Date.now(),
        identifier: 1,
        pressure: 0.5
      };

      expect(() => touchControlManager.handleTouchStart(touch)).not.toThrow();
    });

    it('should handle touch move events', () => {
      const touch: TouchPoint = {
        x: 100,
        y: 100,
        timestamp: Date.now(),
        identifier: 1,
        pressure: 0.5
      };

      touchControlManager.handleTouchStart(touch);
      expect(() => touchControlManager.handleTouchMove(touch)).not.toThrow();
    });

    it('should handle touch end events', () => {
      const touch: TouchPoint = {
        x: 100,
        y: 100,
        timestamp: Date.now(),
        identifier: 1,
        pressure: 0.5
      };

      touchControlManager.handleTouchStart(touch);
      expect(() => touchControlManager.handleTouchEnd(touch)).not.toThrow();
    });
  });

  describe('Gesture Recognition', () => {
    it('should register gesture callbacks', () => {
      const callback = jest.fn();
      touchControlManager.onGesture(GestureType.TAP, callback);
      // Callback registration should not throw
      expect(true).toBe(true);
    });

    it('should remove gesture callbacks', () => {
      const callback = jest.fn();
      touchControlManager.onGesture(GestureType.TAP, callback);
      expect(() => touchControlManager.offGesture(GestureType.TAP, callback)).not.toThrow();
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      const newConfig = {
        minTouchTargetSize: 50,
        gestureConfig: {
          minDistance: 15
        }
      };

      expect(() => touchControlManager.updateConfig(newConfig)).not.toThrow();
    });

    it('should enable/disable touch controls', () => {
      expect(() => touchControlManager.setEnabled(false)).not.toThrow();
      expect(() => touchControlManager.setEnabled(true)).not.toThrow();
    });
  });

  describe('Performance Monitoring', () => {
    it('should return performance metrics', () => {
      const metrics = touchControlManager.getPerformanceMetrics();
      expect(metrics).toHaveProperty('gestureRecognitionTime');
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('batteryImpact');
      expect(metrics).toHaveProperty('errorRate');
      expect(metrics).toHaveProperty('successRate');
    });
  });

  describe('Accessibility', () => {
    it('should return accessibility status', () => {
      const status = touchControlManager.getAccessibilityStatus();
      expect(status).toHaveProperty('screenReaderEnabled');
      expect(status).toHaveProperty('voiceControlEnabled');
      expect(status).toHaveProperty('switchControlEnabled');
      expect(status).toHaveProperty('highContrastEnabled');
      expect(status).toHaveProperty('reducedMotionEnabled');
      expect(status).toHaveProperty('largeTextEnabled');
    });
  });
});