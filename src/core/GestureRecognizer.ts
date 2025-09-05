/**
 * Advanced Gesture Recognition Engine
 * Handles recognition of various touch gestures with high accuracy
 */

import { 
  TouchPoint, 
  GestureState, 
  GestureEvent, 
  GestureType, 
  GestureConfig 
} from '../types/TouchTypes';

export class GestureRecognizer {
  private config: GestureConfig;
  private gestureState: GestureState | null = null;
  private gestureCache: Map<string, any> = new Map();
  private isProcessing: boolean = false;

  constructor(config: GestureConfig) {
    this.config = config;
  }

  /**
   * Handle touch start event
   */
  public onTouchStart(touch: TouchPoint): void {
    if (this.isProcessing) return;

    this.gestureState = {
      startTime: Date.now(),
      startTouches: [touch],
      currentTouches: [touch],
      deltaX: 0,
      deltaY: 0,
      velocityX: 0,
      velocityY: 0,
      scale: 1,
      rotation: 0,
      isActive: true,
      isRecognized: false
    };

    this.isProcessing = true;
  }

  /**
   * Handle touch move event
   */
  public onTouchMove(touch: TouchPoint): GestureState | null {
    if (!this.gestureState || !this.isProcessing) return null;

    // Update current touches
    const touchIndex = this.gestureState.currentTouches.findIndex(t => t.identifier === touch.identifier);
    if (touchIndex >= 0) {
      this.gestureState.currentTouches[touchIndex] = touch;
    } else {
      this.gestureState.currentTouches.push(touch);
    }

    // Calculate deltas
    const startTouch = this.gestureState.startTouches[0];
    this.gestureState.deltaX = touch.x - startTouch.x;
    this.gestureState.deltaY = touch.y - startTouch.y;

    // Calculate velocity
    const timeDelta = touch.timestamp - startTouch.timestamp;
    if (timeDelta > 0) {
      this.gestureState.velocityX = this.gestureState.deltaX / timeDelta;
      this.gestureState.velocityY = this.gestureState.deltaY / timeDelta;
    }

    // Handle multi-touch gestures
    if (this.gestureState.currentTouches.length > 1) {
      this.calculateMultiTouchProperties();
    }

    return this.gestureState;
  }

  /**
   * Handle touch end event
   */
  public onTouchEnd(touch: TouchPoint): GestureEvent | null {
    if (!this.gestureState || !this.isProcessing) return null;

    // Remove touch from current touches
    this.gestureState.currentTouches = this.gestureState.currentTouches.filter(
      t => t.identifier !== touch.identifier
    );

    // If all touches ended, recognize gesture
    if (this.gestureState.currentTouches.length === 0) {
      const gestureType = this.recognizeGesture();
      if (gestureType) {
        const gestureEvent: GestureEvent = {
          type: gestureType,
          state: { ...this.gestureState },
          timestamp: Date.now()
        };

        this.gestureState.isRecognized = true;
        this.gestureState.isActive = false;
        this.isProcessing = false;

        return gestureEvent;
      }
    }

    return null;
  }

  /**
   * Calculate multi-touch properties (scale, rotation)
   */
  private calculateMultiTouchProperties(): void {
    if (this.gestureState!.currentTouches.length < 2) return;

    const touch1 = this.gestureState!.currentTouches[0];
    const touch2 = this.gestureState!.currentTouches[1];
    const startTouch1 = this.gestureState!.startTouches[0];
    const startTouch2 = this.gestureState!.startTouches[1] || startTouch1;

    // Calculate current distance
    const currentDistance = Math.sqrt(
      Math.pow(touch2.x - touch1.x, 2) + Math.pow(touch2.y - touch1.y, 2)
    );

    // Calculate start distance
    const startDistance = Math.sqrt(
      Math.pow(startTouch2.x - startTouch1.x, 2) + Math.pow(startTouch2.y - startTouch1.y, 2)
    );

    // Calculate scale
    if (startDistance > 0) {
      this.gestureState!.scale = currentDistance / startDistance;
    }

    // Calculate rotation
    const currentAngle = Math.atan2(touch2.y - touch1.y, touch2.x - touch1.x);
    const startAngle = Math.atan2(startTouch2.y - startTouch1.y, startTouch2.x - startTouch1.x);
    this.gestureState!.rotation = (currentAngle - startAngle) * (180 / Math.PI);
  }

  /**
   * Recognize gesture type based on current state
   */
  private recognizeGesture(): GestureType | null {
    if (!this.gestureState) return null;

    const duration = Date.now() - this.gestureState.startTime;
    const distance = Math.sqrt(
      Math.pow(this.gestureState.deltaX, 2) + Math.pow(this.gestureState.deltaY, 2)
    );
    const velocity = Math.sqrt(
      Math.pow(this.gestureState.velocityX, 2) + Math.pow(this.gestureState.velocityY, 2)
    );

    // Check for tap gestures
    if (distance < this.config.minDistance && duration < this.config.maxDuration) {
      return GestureType.TAP;
    }

    // Check for long press
    if (distance < this.config.minDistance && duration > this.config.minDuration) {
      return GestureType.LONG_PRESS;
    }

    // Check for swipe gestures
    if (velocity > this.config.velocityThreshold && distance > this.config.minDistance) {
      return this.recognizeSwipeDirection();
    }

    // Check for pan gesture
    if (distance > this.config.minDistance && velocity < this.config.velocityThreshold) {
      return GestureType.PAN;
    }

    // Check for multi-touch gestures
    if (this.gestureState.currentTouches.length > 1) {
      return this.recognizeMultiTouchGesture();
    }

    return null;
  }

  /**
   * Recognize swipe direction
   */
  private recognizeSwipeDirection(): GestureType {
    if (!this.gestureState) return GestureType.PAN;

    const absX = Math.abs(this.gestureState.deltaX);
    const absY = Math.abs(this.gestureState.deltaY);

    if (absX > absY) {
      return this.gestureState.deltaX > 0 ? GestureType.SWIPE_RIGHT : GestureType.SWIPE_LEFT;
    } else {
      return this.gestureState.deltaY > 0 ? GestureType.SWIPE_DOWN : GestureType.SWIPE_UP;
    }
  }

  /**
   * Recognize multi-touch gestures
   */
  private recognizeMultiTouchGesture(): GestureType | null {
    if (!this.gestureState) return null;

    // Check for pinch gesture
    if (Math.abs(this.gestureState.scale - 1) > this.config.scaleThreshold) {
      return GestureType.PINCH;
    }

    // Check for rotation gesture
    if (Math.abs(this.gestureState.rotation) > this.config.rotationThreshold) {
      return GestureType.ROTATE;
    }

    return null;
  }

  /**
   * Check for edge swipe gesture
   */
  private isEdgeSwipe(touch: TouchPoint, screenWidth: number, screenHeight: number): boolean {
    const edgeThreshold = 50; // pixels from edge
    
    return (
      touch.x < edgeThreshold || 
      touch.x > screenWidth - edgeThreshold ||
      touch.y < edgeThreshold || 
      touch.y > screenHeight - edgeThreshold
    );
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: GestureConfig): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Reset gesture recognizer
   */
  public reset(): void {
    this.gestureState = null;
    this.isProcessing = false;
  }

  /**
   * Get current gesture state
   */
  public getCurrentState(): GestureState | null {
    return this.gestureState;
  }

  /**
   * Check if gesture is currently being processed
   */
  public isGestureActive(): boolean {
    return this.isProcessing && this.gestureState?.isActive === true;
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.gestureCache.clear();
    this.reset();
  }
}