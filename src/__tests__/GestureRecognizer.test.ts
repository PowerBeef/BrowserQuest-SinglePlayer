/**
 * Tests for GestureRecognizer
 */

import { GestureRecognizer } from '../core/GestureRecognizer';
import { GestureConfig, TouchPoint, GestureType } from '../types/TouchTypes';

describe('GestureRecognizer', () => {
  let gestureRecognizer: GestureRecognizer;
  let mockConfig: GestureConfig;

  beforeEach(() => {
    mockConfig = {
      minDistance: 10,
      maxDistance: 1000,
      minDuration: 100,
      maxDuration: 2000,
      velocityThreshold: 0.3,
      scaleThreshold: 0.1,
      rotationThreshold: 15
    };

    gestureRecognizer = new GestureRecognizer(mockConfig);
  });

  afterEach(() => {
    gestureRecognizer.destroy();
  });

  describe('Touch Event Handling', () => {
    it('should handle touch start', () => {
      const touch: TouchPoint = {
        x: 100,
        y: 100,
        timestamp: Date.now(),
        identifier: 1,
        pressure: 0.5
      };

      expect(() => gestureRecognizer.onTouchStart(touch)).not.toThrow();
      expect(gestureRecognizer.isGestureActive()).toBe(true);
    });

    it('should handle touch move', () => {
      const startTouch: TouchPoint = {
        x: 100,
        y: 100,
        timestamp: Date.now(),
        identifier: 1,
        pressure: 0.5
      };

      const moveTouch: TouchPoint = {
        x: 110,
        y: 110,
        timestamp: Date.now() + 100,
        identifier: 1,
        pressure: 0.5
      };

      gestureRecognizer.onTouchStart(startTouch);
      const gestureState = gestureRecognizer.onTouchMove(moveTouch);
      
      expect(gestureState).toBeDefined();
      expect(gestureState?.deltaX).toBe(10);
      expect(gestureState?.deltaY).toBe(10);
    });

    it('should handle touch end', () => {
      const startTouch: TouchPoint = {
        x: 100,
        y: 100,
        timestamp: Date.now(),
        identifier: 1,
        pressure: 0.5
      };

      const endTouch: TouchPoint = {
        x: 100,
        y: 100,
        timestamp: Date.now() + 50,
        identifier: 1,
        pressure: 0.5
      };

      gestureRecognizer.onTouchStart(startTouch);
      const gestureEvent = gestureRecognizer.onTouchEnd(endTouch);
      
      expect(gestureEvent).toBeDefined();
      expect(gestureEvent?.type).toBe(GestureType.TAP);
    });
  });

  describe('Gesture Recognition', () => {
    it('should recognize tap gesture', () => {
      const startTouch: TouchPoint = {
        x: 100,
        y: 100,
        timestamp: Date.now(),
        identifier: 1,
        pressure: 0.5
      };

      const endTouch: TouchPoint = {
        x: 102,
        y: 102,
        timestamp: Date.now() + 50,
        identifier: 1,
        pressure: 0.5
      };

      gestureRecognizer.onTouchStart(startTouch);
      const gestureEvent = gestureRecognizer.onTouchEnd(endTouch);
      
      expect(gestureEvent?.type).toBe(GestureType.TAP);
    });

    it('should recognize swipe gesture', () => {
      const startTouch: TouchPoint = {
        x: 100,
        y: 100,
        timestamp: Date.now(),
        identifier: 1,
        pressure: 0.5
      };

      const endTouch: TouchPoint = {
        x: 200,
        y: 100,
        timestamp: Date.now() + 200,
        identifier: 1,
        pressure: 0.5
      };

      gestureRecognizer.onTouchStart(startTouch);
      const gestureEvent = gestureRecognizer.onTouchEnd(endTouch);
      
      expect(gestureEvent?.type).toBe(GestureType.SWIPE_RIGHT);
    });

    it('should recognize long press gesture', () => {
      const startTouch: TouchPoint = {
        x: 100,
        y: 100,
        timestamp: Date.now(),
        identifier: 1,
        pressure: 0.5
      };

      const endTouch: TouchPoint = {
        x: 100,
        y: 100,
        timestamp: Date.now() + 600,
        identifier: 1,
        pressure: 0.5
      };

      gestureRecognizer.onTouchStart(startTouch);
      const gestureEvent = gestureRecognizer.onTouchEnd(endTouch);
      
      expect(gestureEvent?.type).toBe(GestureType.LONG_PRESS);
    });
  });

  describe('Multi-touch Gestures', () => {
    it('should handle multi-touch start', () => {
      const touch1: TouchPoint = {
        x: 100,
        y: 100,
        timestamp: Date.now(),
        identifier: 1,
        pressure: 0.5
      };

      const touch2: TouchPoint = {
        x: 200,
        y: 200,
        timestamp: Date.now(),
        identifier: 2,
        pressure: 0.5
      };

      gestureRecognizer.onTouchStart(touch1);
      gestureRecognizer.onTouchStart(touch2);
      
      const currentState = gestureRecognizer.getCurrentState();
      expect(currentState?.currentTouches).toHaveLength(2);
    });

    it('should calculate scale for pinch gesture', () => {
      const startTouch1: TouchPoint = {
        x: 100,
        y: 100,
        timestamp: Date.now(),
        identifier: 1,
        pressure: 0.5
      };

      const startTouch2: TouchPoint = {
        x: 200,
        y: 100,
        timestamp: Date.now(),
        identifier: 2,
        pressure: 0.5
      };

      const moveTouch1: TouchPoint = {
        x: 90,
        y: 100,
        timestamp: Date.now() + 100,
        identifier: 1,
        pressure: 0.5
      };

      const moveTouch2: TouchPoint = {
        x: 210,
        y: 100,
        timestamp: Date.now() + 100,
        identifier: 2,
        pressure: 0.5
      };

      gestureRecognizer.onTouchStart(startTouch1);
      gestureRecognizer.onTouchStart(startTouch2);
      gestureRecognizer.onTouchMove(moveTouch1);
      gestureRecognizer.onTouchMove(moveTouch2);
      
      const currentState = gestureRecognizer.getCurrentState();
      expect(currentState?.scale).toBeGreaterThan(1);
    });
  });

  describe('Configuration', () => {
    it('should update configuration', () => {
      const newConfig: GestureConfig = {
        minDistance: 20,
        maxDistance: 2000,
        minDuration: 200,
        maxDuration: 3000,
        velocityThreshold: 0.5,
        scaleThreshold: 0.2,
        rotationThreshold: 30
      };

      expect(() => gestureRecognizer.updateConfig(newConfig)).not.toThrow();
    });

    it('should reset gesture recognizer', () => {
      const touch: TouchPoint = {
        x: 100,
        y: 100,
        timestamp: Date.now(),
        identifier: 1,
        pressure: 0.5
      };

      gestureRecognizer.onTouchStart(touch);
      expect(gestureRecognizer.isGestureActive()).toBe(true);
      
      gestureRecognizer.reset();
      expect(gestureRecognizer.isGestureActive()).toBe(false);
    });
  });

  describe('State Management', () => {
    it('should return current gesture state', () => {
      const touch: TouchPoint = {
        x: 100,
        y: 100,
        timestamp: Date.now(),
        identifier: 1,
        pressure: 0.5
      };

      gestureRecognizer.onTouchStart(touch);
      const state = gestureRecognizer.getCurrentState();
      
      expect(state).toBeDefined();
      expect(state?.isActive).toBe(true);
      expect(state?.startTouches).toHaveLength(1);
    });

    it('should check if gesture is active', () => {
      expect(gestureRecognizer.isGestureActive()).toBe(false);
      
      const touch: TouchPoint = {
        x: 100,
        y: 100,
        timestamp: Date.now(),
        identifier: 1,
        pressure: 0.5
      };

      gestureRecognizer.onTouchStart(touch);
      expect(gestureRecognizer.isGestureActive()).toBe(true);
    });
  });
});