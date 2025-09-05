/**
 * Core types for touch control system
 */

export interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
  pressure?: number;
  identifier: number;
}

export interface GestureState {
  startTime: number;
  startTouches: TouchPoint[];
  currentTouches: TouchPoint[];
  deltaX: number;
  deltaY: number;
  velocityX: number;
  velocityY: number;
  scale: number;
  rotation: number;
  isActive: boolean;
  isRecognized: boolean;
}

export interface GestureConfig {
  minDistance: number;
  maxDistance: number;
  minDuration: number;
  maxDuration: number;
  velocityThreshold: number;
  scaleThreshold: number;
  rotationThreshold: number;
}

export interface TouchTarget {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minSize: number;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: string;
}

export interface GestureEvent {
  type: GestureType;
  state: GestureState;
  target?: TouchTarget;
  timestamp: number;
  nativeEvent?: any;
}

export enum GestureType {
  TAP = 'tap',
  DOUBLE_TAP = 'double_tap',
  LONG_PRESS = 'long_press',
  SWIPE_LEFT = 'swipe_left',
  SWIPE_RIGHT = 'swipe_right',
  SWIPE_UP = 'swipe_up',
  SWIPE_DOWN = 'swipe_down',
  PAN = 'pan',
  PINCH = 'pinch',
  ROTATE = 'rotate',
  EDGE_SWIPE = 'edge_swipe',
  FORCE_TOUCH = 'force_touch'
}

export enum TouchFeedbackType {
  VISUAL = 'visual',
  HAPTIC = 'haptic',
  AUDIO = 'audio'
}

export interface AccessibilityConfig {
  screenReaderEnabled: boolean;
  voiceControlEnabled: boolean;
  switchControlEnabled: boolean;
  highContrastEnabled: boolean;
  reducedMotionEnabled: boolean;
  largeTextEnabled: boolean;
}

export interface PerformanceMetrics {
  gestureRecognitionTime: number;
  memoryUsage: number;
  batteryImpact: number;
  errorRate: number;
  successRate: number;
}

export interface TouchControlConfig {
  platform: 'ios' | 'android' | 'web';
  minTouchTargetSize: number;
  maxTouchTargetSize: number;
  spacingBetweenTargets: number;
  gestureConfig: GestureConfig;
  accessibility: AccessibilityConfig;
  performance: {
    maxRecognitionTime: number;
    maxMemoryUsage: number;
    enableCaching: boolean;
    enableOptimization: boolean;
  };
}