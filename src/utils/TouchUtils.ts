/**
 * Touch Utilities
 * Helper functions for touch control calculations and validations
 */

import { TouchPoint, TouchTarget, GestureState } from '../types/TouchTypes';

/**
 * Calculate distance between two touch points
 */
export const calculateDistance = (point1: TouchPoint, point2: TouchPoint): number => {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Calculate angle between two touch points
 */
export const calculateAngle = (point1: TouchPoint, point2: TouchPoint): number => {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.atan2(dy, dx) * (180 / Math.PI);
};

/**
 * Calculate velocity between two touch points
 */
export const calculateVelocity = (point1: TouchPoint, point2: TouchPoint): { x: number; y: number } => {
  const timeDelta = point2.timestamp - point1.timestamp;
  if (timeDelta <= 0) return { x: 0, y: 0 };

  return {
    x: (point2.x - point1.x) / timeDelta,
    y: (point2.y - point1.y) / timeDelta
  };
};

/**
 * Check if a touch point is within a touch target
 */
export const isTouchInTarget = (touch: TouchPoint, target: TouchTarget): boolean => {
  return (
    touch.x >= target.x &&
    touch.x <= target.x + target.width &&
    touch.y >= target.y &&
    touch.y <= target.y + target.height
  );
};

/**
 * Find the closest touch target to a touch point
 */
export const findClosestTarget = (touch: TouchPoint, targets: TouchTarget[]): TouchTarget | null => {
  let closestTarget: TouchTarget | null = null;
  let minDistance = Infinity;

  targets.forEach(target => {
    const centerX = target.x + target.width / 2;
    const centerY = target.y + target.height / 2;
    const distance = Math.sqrt(
      Math.pow(touch.x - centerX, 2) + Math.pow(touch.y - centerY, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestTarget = target;
    }
  });

  return closestTarget;
};

/**
 * Validate touch target size meets accessibility requirements
 */
export const validateTouchTargetSize = (target: TouchTarget, minSize: number = 44): boolean => {
  return target.width >= minSize && target.height >= minSize;
};

/**
 * Check if two touch targets are too close together
 */
export const areTargetsTooClose = (target1: TouchTarget, target2: TouchTarget, minSpacing: number = 8): boolean => {
  const center1X = target1.x + target1.width / 2;
  const center1Y = target1.y + target1.height / 2;
  const center2X = target2.x + target2.width / 2;
  const center2Y = target2.y + target2.height / 2;

  const distance = Math.sqrt(
    Math.pow(center2X - center1X, 2) + Math.pow(center2Y - center1Y, 2)
  );

  return distance < minSpacing;
};

/**
 * Calculate gesture direction from delta values
 */
export const calculateGestureDirection = (deltaX: number, deltaY: number): string => {
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);

  if (absX > absY) {
    return deltaX > 0 ? 'right' : 'left';
  } else {
    return deltaY > 0 ? 'down' : 'up';
  }
};

/**
 * Normalize touch coordinates to screen percentage
 */
export const normalizeTouchCoordinates = (touch: TouchPoint, screenWidth: number, screenHeight: number): TouchPoint => {
  return {
    ...touch,
    x: touch.x / screenWidth,
    y: touch.y / screenHeight
  };
};

/**
 * Denormalize touch coordinates from screen percentage
 */
export const denormalizeTouchCoordinates = (touch: TouchPoint, screenWidth: number, screenHeight: number): TouchPoint => {
  return {
    ...touch,
    x: touch.x * screenWidth,
    y: touch.y * screenHeight
  };
};

/**
 * Calculate gesture scale from two touch points
 */
export const calculateGestureScale = (startPoints: TouchPoint[], currentPoints: TouchPoint[]): number => {
  if (startPoints.length < 2 || currentPoints.length < 2) return 1;

  const startDistance = calculateDistance(startPoints[0], startPoints[1]);
  const currentDistance = calculateDistance(currentPoints[0], currentPoints[1]);

  return startDistance > 0 ? currentDistance / startDistance : 1;
};

/**
 * Calculate gesture rotation from two touch points
 */
export const calculateGestureRotation = (startPoints: TouchPoint[], currentPoints: TouchPoint[]): number => {
  if (startPoints.length < 2 || currentPoints.length < 2) return 0;

  const startAngle = calculateAngle(startPoints[0], startPoints[1]);
  const currentAngle = calculateAngle(currentPoints[0], currentPoints[1]);

  return currentAngle - startAngle;
};

/**
 * Check if gesture is a tap based on movement and duration
 */
export const isTapGesture = (gestureState: GestureState, maxDistance: number = 10, maxDuration: number = 500): boolean => {
  const distance = Math.sqrt(
    Math.pow(gestureState.deltaX, 2) + Math.pow(gestureState.deltaY, 2)
  );
  const duration = Date.now() - gestureState.startTime;

  return distance < maxDistance && duration < maxDuration;
};

/**
 * Check if gesture is a swipe based on velocity and distance
 */
export const isSwipeGesture = (gestureState: GestureState, minVelocity: number = 0.3, minDistance: number = 50): boolean => {
  const velocity = Math.sqrt(
    Math.pow(gestureState.velocityX, 2) + Math.pow(gestureState.velocityY, 2)
  );
  const distance = Math.sqrt(
    Math.pow(gestureState.deltaX, 2) + Math.pow(gestureState.deltaY, 2)
  );

  return velocity > minVelocity && distance > minDistance;
};

/**
 * Check if gesture is a long press based on duration
 */
export const isLongPressGesture = (gestureState: GestureState, minDuration: number = 500): boolean => {
  const duration = Date.now() - gestureState.startTime;
  return duration > minDuration;
};

/**
 * Debounce function for touch events
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function for touch events
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Convert pixels to density-independent pixels (Android)
 */
export const pxToDp = (px: number, density: number = 2): number => {
  return px / density;
};

/**
 * Convert density-independent pixels to pixels (Android)
 */
export const dpToPx = (dp: number, density: number = 2): number => {
  return dp * density;
};

/**
 * Convert points to pixels (iOS)
 */
export const ptToPx = (pt: number, scale: number = 2): number => {
  return pt * scale;
};

/**
 * Convert pixels to points (iOS)
 */
export const pxToPt = (px: number, scale: number = 2): number => {
  return px / scale;
};

/**
 * Get optimal touch target size for platform
 */
export const getOptimalTouchTargetSize = (platform: 'ios' | 'android' | 'web'): number => {
  switch (platform) {
    case 'ios':
      return 44; // 44pt
    case 'android':
      return 48; // 48dp
    case 'web':
      return 44; // 44px
    default:
      return 44;
  }
};

/**
 * Check if device supports haptic feedback
 */
export const supportsHapticFeedback = (platform: string): boolean => {
  return platform === 'ios' || platform === 'android';
};

/**
 * Check if device supports force touch
 */
export const supportsForceTouch = (platform: string): boolean => {
  return platform === 'ios';
};

/**
 * Generate unique touch target ID
 */
export const generateTouchTargetId = (prefix: string = 'target'): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create touch target from element bounds
 */
export const createTouchTargetFromBounds = (
  id: string,
  bounds: { x: number; y: number; width: number; height: number },
  accessibilityLabel?: string,
  accessibilityHint?: string,
  accessibilityRole?: string
): TouchTarget => {
  return {
    id,
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    minSize: Math.min(bounds.width, bounds.height),
    accessibilityLabel,
    accessibilityHint,
    accessibilityRole
  };
};