/**
 * Custom Hook for Touch Controls
 * Provides easy integration of touch control functionality
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import { TouchControlManager } from '../core/TouchControlManager';
import { 
  TouchControlConfig, 
  GestureEvent, 
  GestureType,
  TouchPoint,
  PerformanceMetrics,
  TouchTarget
} from '../types/TouchTypes';

interface UseTouchControlsOptions {
  config?: Partial<TouchControlConfig>;
  onGesture?: (gestureEvent: GestureEvent) => void;
  onTouchStart?: (touch: TouchPoint) => void;
  onTouchMove?: (touch: TouchPoint) => void;
  onTouchEnd?: (touch: TouchPoint) => void;
  autoCleanup?: boolean;
}

interface UseTouchControlsReturn {
  touchControlManager: TouchControlManager | null;
  isEnabled: boolean;
  performanceMetrics: PerformanceMetrics | null;
  registerTouchTarget: (target: TouchTarget) => void;
  unregisterTouchTarget: (targetId: string) => void;
  setEnabled: (enabled: boolean) => void;
  updateConfig: (newConfig: Partial<TouchControlConfig>) => void;
  onGesture: (gestureType: GestureType, callback: (event: GestureEvent) => void) => void;
  offGesture: (gestureType: GestureType, callback: (event: GestureEvent) => void) => void;
  getAccessibilityStatus: () => any;
  destroy: () => void;
}

export const useTouchControls = (options: UseTouchControlsOptions = {}): UseTouchControlsReturn => {
  const {
    config,
    onGesture,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    autoCleanup = true
  } = options;

  const touchControlManagerRef = useRef<TouchControlManager | null>(null);
  const [isEnabled, setIsEnabled] = useState(true);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const performanceIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Default configuration
  const defaultConfig: TouchControlConfig = {
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

  const finalConfig = { ...defaultConfig, ...config };

  // Initialize touch control manager
  useEffect(() => {
    touchControlManagerRef.current = new TouchControlManager(finalConfig);

    // Set up global callbacks
    if (onGesture) {
      Object.values(GestureType).forEach(gestureType => {
        touchControlManagerRef.current?.onGesture(gestureType, onGesture);
      });
    }

    // Set up performance monitoring
    if (touchControlManagerRef.current) {
      performanceIntervalRef.current = setInterval(() => {
        const metrics = touchControlManagerRef.current?.getPerformanceMetrics();
        if (metrics) {
          setPerformanceMetrics(metrics);
        }
      }, 1000);
    }

    return () => {
      if (autoCleanup) {
        cleanup();
      }
    };
  }, [finalConfig, onGesture, autoCleanup]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (performanceIntervalRef.current) {
      clearInterval(performanceIntervalRef.current);
      performanceIntervalRef.current = null;
    }
    
    if (touchControlManagerRef.current) {
      touchControlManagerRef.current.destroy();
      touchControlManagerRef.current = null;
    }
  }, []);

  // Register touch target
  const registerTouchTarget = useCallback((target: TouchTarget) => {
    touchControlManagerRef.current?.registerTouchTarget(target);
  }, []);

  // Unregister touch target
  const unregisterTouchTarget = useCallback((targetId: string) => {
    touchControlManagerRef.current?.unregisterTouchTarget(targetId);
  }, []);

  // Set enabled state
  const setEnabled = useCallback((enabled: boolean) => {
    setIsEnabled(enabled);
    touchControlManagerRef.current?.setEnabled(enabled);
  }, []);

  // Update configuration
  const updateConfig = useCallback((newConfig: Partial<TouchControlConfig>) => {
    touchControlManagerRef.current?.updateConfig(newConfig);
  }, []);

  // Register gesture callback
  const onGestureCallback = useCallback((gestureType: GestureType, callback: (event: GestureEvent) => void) => {
    touchControlManagerRef.current?.onGesture(gestureType, callback);
  }, []);

  // Unregister gesture callback
  const offGestureCallback = useCallback((gestureType: GestureType, callback: (event: GestureEvent) => void) => {
    touchControlManagerRef.current?.offGesture(gestureType, callback);
  }, []);

  // Get accessibility status
  const getAccessibilityStatus = useCallback(() => {
    return touchControlManagerRef.current?.getAccessibilityStatus();
  }, []);

  // Destroy manager
  const destroy = useCallback(() => {
    cleanup();
  }, [cleanup]);

  return {
    touchControlManager: touchControlManagerRef.current,
    isEnabled,
    performanceMetrics,
    registerTouchTarget,
    unregisterTouchTarget,
    setEnabled,
    updateConfig,
    onGesture: onGestureCallback,
    offGesture: offGestureCallback,
    getAccessibilityStatus,
    destroy
  };
};

export default useTouchControls;