/**
 * Mobile Touch Controls - Main Export
 * Comprehensive touch control system for React Native
 */

// Core components
export { TouchControlView } from './components/TouchControlView';
export { TouchTarget } from './components/TouchTarget';

// Hooks
export { useTouchControls } from './hooks/useTouchControls';

// Core classes
export { TouchControlManager } from './core/TouchControlManager';
export { GestureRecognizer } from './core/GestureRecognizer';
export { AccessibilityManager } from './core/AccessibilityManager';
export { PerformanceMonitor } from './core/PerformanceMonitor';
export { FeedbackManager } from './core/FeedbackManager';

// Services
export { 
  PlatformTouchService,
  IOSTouchService,
  AndroidTouchService,
  WebTouchService,
  TouchServiceFactory,
  CrossPlatformTouchService
} from './services/PlatformTouchService';

// Optimization
export { PerformanceOptimizer } from './optimization/PerformanceOptimizer';
export { MemoryManager } from './optimization/MemoryManager';

// Utilities
export * from './utils/TouchUtils';

// Types
export * from './types/TouchTypes';

// Default configuration
export const defaultTouchControlConfig = {
  platform: 'ios' as const,
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
    rotationThreshold: 15,
  },
  accessibility: {
    screenReaderEnabled: false,
    voiceControlEnabled: false,
    switchControlEnabled: false,
    highContrastEnabled: false,
    reducedMotionEnabled: false,
    largeTextEnabled: false,
  },
  performance: {
    maxRecognitionTime: 100,
    maxMemoryUsage: 50,
    enableCaching: true,
    enableOptimization: true,
  },
};