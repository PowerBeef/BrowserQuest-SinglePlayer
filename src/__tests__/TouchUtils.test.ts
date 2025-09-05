/**
 * Tests for Touch Utilities
 */

import {
  calculateDistance,
  calculateAngle,
  calculateVelocity,
  isTouchInTarget,
  findClosestTarget,
  validateTouchTargetSize,
  areTargetsTooClose,
  calculateGestureDirection,
  normalizeTouchCoordinates,
  denormalizeTouchCoordinates,
  calculateGestureScale,
  calculateGestureRotation,
  isTapGesture,
  isSwipeGesture,
  isLongPressGesture,
  getOptimalTouchTargetSize,
  supportsHapticFeedback,
  supportsForceTouch,
  generateTouchTargetId,
  createTouchTargetFromBounds
} from '../utils/TouchUtils';
import { TouchPoint, TouchTarget, GestureState } from '../types/TouchTypes';

describe('TouchUtils', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two points', () => {
      const point1: TouchPoint = { x: 0, y: 0, timestamp: 0, identifier: 1 };
      const point2: TouchPoint = { x: 3, y: 4, timestamp: 0, identifier: 2 };
      
      const distance = calculateDistance(point1, point2);
      expect(distance).toBe(5);
    });

    it('should return 0 for same points', () => {
      const point: TouchPoint = { x: 100, y: 100, timestamp: 0, identifier: 1 };
      
      const distance = calculateDistance(point, point);
      expect(distance).toBe(0);
    });
  });

  describe('calculateAngle', () => {
    it('should calculate angle between two points', () => {
      const point1: TouchPoint = { x: 0, y: 0, timestamp: 0, identifier: 1 };
      const point2: TouchPoint = { x: 1, y: 1, timestamp: 0, identifier: 2 };
      
      const angle = calculateAngle(point1, point2);
      expect(angle).toBeCloseTo(45);
    });

    it('should calculate angle for horizontal line', () => {
      const point1: TouchPoint = { x: 0, y: 0, timestamp: 0, identifier: 1 };
      const point2: TouchPoint = { x: 1, y: 0, timestamp: 0, identifier: 2 };
      
      const angle = calculateAngle(point1, point2);
      expect(angle).toBeCloseTo(0);
    });
  });

  describe('calculateVelocity', () => {
    it('should calculate velocity between two points', () => {
      const point1: TouchPoint = { x: 0, y: 0, timestamp: 0, identifier: 1 };
      const point2: TouchPoint = { x: 100, y: 100, timestamp: 1000, identifier: 1 };
      
      const velocity = calculateVelocity(point1, point2);
      expect(velocity.x).toBeCloseTo(0.1);
      expect(velocity.y).toBeCloseTo(0.1);
    });

    it('should return zero velocity for same timestamp', () => {
      const point1: TouchPoint = { x: 0, y: 0, timestamp: 1000, identifier: 1 };
      const point2: TouchPoint = { x: 100, y: 100, timestamp: 1000, identifier: 1 };
      
      const velocity = calculateVelocity(point1, point2);
      expect(velocity.x).toBe(0);
      expect(velocity.y).toBe(0);
    });
  });

  describe('isTouchInTarget', () => {
    const target: TouchTarget = {
      id: 'test-target',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      minSize: 44,
      accessibilityLabel: 'Test Target',
      accessibilityRole: 'button'
    };

    it('should return true for touch inside target', () => {
      const touch: TouchPoint = { x: 50, y: 50, timestamp: 0, identifier: 1 };
      expect(isTouchInTarget(touch, target)).toBe(true);
    });

    it('should return false for touch outside target', () => {
      const touch: TouchPoint = { x: 150, y: 150, timestamp: 0, identifier: 1 };
      expect(isTouchInTarget(touch, target)).toBe(false);
    });

    it('should return true for touch on target edge', () => {
      const touch: TouchPoint = { x: 100, y: 100, timestamp: 0, identifier: 1 };
      expect(isTouchInTarget(touch, target)).toBe(true);
    });
  });

  describe('findClosestTarget', () => {
    const targets: TouchTarget[] = [
      {
        id: 'target1',
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        minSize: 44,
        accessibilityLabel: 'Target 1',
        accessibilityRole: 'button'
      },
      {
        id: 'target2',
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        minSize: 44,
        accessibilityLabel: 'Target 2',
        accessibilityRole: 'button'
      }
    ];

    it('should find closest target', () => {
      const touch: TouchPoint = { x: 25, y: 25, timestamp: 0, identifier: 1 };
      const closest = findClosestTarget(touch, targets);
      expect(closest?.id).toBe('target1');
    });

    it('should return null for empty targets array', () => {
      const touch: TouchPoint = { x: 25, y: 25, timestamp: 0, identifier: 1 };
      const closest = findClosestTarget(touch, []);
      expect(closest).toBeNull();
    });
  });

  describe('validateTouchTargetSize', () => {
    it('should return true for valid target size', () => {
      const target: TouchTarget = {
        id: 'valid-target',
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        minSize: 44,
        accessibilityLabel: 'Valid Target',
        accessibilityRole: 'button'
      };

      expect(validateTouchTargetSize(target)).toBe(true);
    });

    it('should return false for invalid target size', () => {
      const target: TouchTarget = {
        id: 'invalid-target',
        x: 0,
        y: 0,
        width: 30,
        height: 30,
        minSize: 30,
        accessibilityLabel: 'Invalid Target',
        accessibilityRole: 'button'
      };

      expect(validateTouchTargetSize(target, 44)).toBe(false);
    });
  });

  describe('areTargetsTooClose', () => {
    it('should return true for targets that are too close', () => {
      const target1: TouchTarget = {
        id: 'target1',
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        minSize: 44,
        accessibilityLabel: 'Target 1',
        accessibilityRole: 'button'
      };

      const target2: TouchTarget = {
        id: 'target2',
        x: 10,
        y: 10,
        width: 50,
        height: 50,
        minSize: 44,
        accessibilityLabel: 'Target 2',
        accessibilityRole: 'button'
      };

      expect(areTargetsTooClose(target1, target2, 20)).toBe(true);
    });

    it('should return false for targets that are far enough apart', () => {
      const target1: TouchTarget = {
        id: 'target1',
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        minSize: 44,
        accessibilityLabel: 'Target 1',
        accessibilityRole: 'button'
      };

      const target2: TouchTarget = {
        id: 'target2',
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        minSize: 44,
        accessibilityLabel: 'Target 2',
        accessibilityRole: 'button'
      };

      expect(areTargetsTooClose(target1, target2, 20)).toBe(false);
    });
  });

  describe('calculateGestureDirection', () => {
    it('should calculate right direction', () => {
      expect(calculateGestureDirection(10, 5)).toBe('right');
    });

    it('should calculate left direction', () => {
      expect(calculateGestureDirection(-10, 5)).toBe('left');
    });

    it('should calculate down direction', () => {
      expect(calculateGestureDirection(5, 10)).toBe('down');
    });

    it('should calculate up direction', () => {
      expect(calculateGestureDirection(5, -10)).toBe('up');
    });
  });

  describe('coordinate normalization', () => {
    it('should normalize touch coordinates', () => {
      const touch: TouchPoint = { x: 100, y: 200, timestamp: 0, identifier: 1 };
      const normalized = normalizeTouchCoordinates(touch, 400, 800);
      
      expect(normalized.x).toBe(0.25);
      expect(normalized.y).toBe(0.25);
    });

    it('should denormalize touch coordinates', () => {
      const touch: TouchPoint = { x: 0.25, y: 0.25, timestamp: 0, identifier: 1 };
      const denormalized = denormalizeTouchCoordinates(touch, 400, 800);
      
      expect(denormalized.x).toBe(100);
      expect(denormalized.y).toBe(200);
    });
  });

  describe('gesture scale and rotation', () => {
    it('should calculate gesture scale', () => {
      const startPoints: TouchPoint[] = [
        { x: 0, y: 0, timestamp: 0, identifier: 1 },
        { x: 100, y: 0, timestamp: 0, identifier: 2 }
      ];

      const currentPoints: TouchPoint[] = [
        { x: 0, y: 0, timestamp: 0, identifier: 1 },
        { x: 200, y: 0, timestamp: 0, identifier: 2 }
      ];

      const scale = calculateGestureScale(startPoints, currentPoints);
      expect(scale).toBe(2);
    });

    it('should calculate gesture rotation', () => {
      const startPoints: TouchPoint[] = [
        { x: 0, y: 0, timestamp: 0, identifier: 1 },
        { x: 100, y: 0, timestamp: 0, identifier: 2 }
      ];

      const currentPoints: TouchPoint[] = [
        { x: 0, y: 0, timestamp: 0, identifier: 1 },
        { x: 0, y: 100, timestamp: 0, identifier: 2 }
      ];

      const rotation = calculateGestureRotation(startPoints, currentPoints);
      expect(rotation).toBeCloseTo(90);
    });
  });

  describe('gesture type detection', () => {
    it('should detect tap gesture', () => {
      const gestureState: GestureState = {
        startTime: Date.now() - 50,
        startTouches: [],
        currentTouches: [],
        deltaX: 5,
        deltaY: 5,
        velocityX: 0,
        velocityY: 0,
        scale: 1,
        rotation: 0,
        isActive: false,
        isRecognized: false
      };

      expect(isTapGesture(gestureState)).toBe(true);
    });

    it('should detect swipe gesture', () => {
      const gestureState: GestureState = {
        startTime: Date.now() - 200,
        startTouches: [],
        currentTouches: [],
        deltaX: 100,
        deltaY: 0,
        velocityX: 0.5,
        velocityY: 0,
        scale: 1,
        rotation: 0,
        isActive: false,
        isRecognized: false
      };

      expect(isSwipeGesture(gestureState)).toBe(true);
    });

    it('should detect long press gesture', () => {
      const gestureState: GestureState = {
        startTime: Date.now() - 600,
        startTouches: [],
        currentTouches: [],
        deltaX: 5,
        deltaY: 5,
        velocityX: 0,
        velocityY: 0,
        scale: 1,
        rotation: 0,
        isActive: false,
        isRecognized: false
      };

      expect(isLongPressGesture(gestureState)).toBe(true);
    });
  });

  describe('platform utilities', () => {
    it('should return optimal touch target size for iOS', () => {
      expect(getOptimalTouchTargetSize('ios')).toBe(44);
    });

    it('should return optimal touch target size for Android', () => {
      expect(getOptimalTouchTargetSize('android')).toBe(48);
    });

    it('should return optimal touch target size for web', () => {
      expect(getOptimalTouchTargetSize('web')).toBe(44);
    });

    it('should check haptic feedback support', () => {
      expect(supportsHapticFeedback('ios')).toBe(true);
      expect(supportsHapticFeedback('android')).toBe(true);
      expect(supportsHapticFeedback('web')).toBe(false);
    });

    it('should check force touch support', () => {
      expect(supportsForceTouch('ios')).toBe(true);
      expect(supportsForceTouch('android')).toBe(false);
      expect(supportsForceTouch('web')).toBe(false);
    });
  });

  describe('utility functions', () => {
    it('should generate unique touch target ID', () => {
      const id1 = generateTouchTargetId('test');
      const id2 = generateTouchTargetId('test');
      
      expect(id1).toMatch(/^test_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^test_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    it('should create touch target from bounds', () => {
      const bounds = { x: 10, y: 20, width: 50, height: 60 };
      const target = createTouchTargetFromBounds(
        'test-target',
        bounds,
        'Test Target',
        'Tap to activate',
        'button'
      );

      expect(target.id).toBe('test-target');
      expect(target.x).toBe(10);
      expect(target.y).toBe(20);
      expect(target.width).toBe(50);
      expect(target.height).toBe(60);
      expect(target.minSize).toBe(50);
      expect(target.accessibilityLabel).toBe('Test Target');
      expect(target.accessibilityHint).toBe('Tap to activate');
      expect(target.accessibilityRole).toBe('button');
    });
  });
});