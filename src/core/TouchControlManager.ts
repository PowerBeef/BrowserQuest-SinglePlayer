/**
 * Core Touch Control Manager
 * Central hub for managing all touch interactions and gesture recognition
 */

import { 
  TouchPoint, 
  GestureState, 
  GestureEvent, 
  GestureType, 
  TouchTarget,
  TouchControlConfig,
  PerformanceMetrics,
  TouchFeedbackType
} from '../types/TouchTypes';
import { GestureRecognizer } from './GestureRecognizer';
import { AccessibilityManager } from './AccessibilityManager';
import { PerformanceMonitor } from './PerformanceMonitor';
import { FeedbackManager } from './FeedbackManager';

export class TouchControlManager {
  private gestureRecognizer: GestureRecognizer;
  private accessibilityManager: AccessibilityManager;
  private performanceMonitor: PerformanceMonitor;
  private feedbackManager: FeedbackManager;
  private config: TouchControlConfig;
  private activeTouches: Map<number, TouchPoint> = new Map();
  private touchTargets: Map<string, TouchTarget> = new Map();
  private gestureCallbacks: Map<GestureType, Function[]> = new Map();
  private isEnabled: boolean = true;

  constructor(config: TouchControlConfig) {
    this.config = config;
    this.gestureRecognizer = new GestureRecognizer(config.gestureConfig);
    this.accessibilityManager = new AccessibilityManager(config.accessibility);
    this.performanceMonitor = new PerformanceMonitor();
    this.feedbackManager = new FeedbackManager();
    
    this.initializeGestureCallbacks();
  }

  /**
   * Initialize gesture callback maps
   */
  private initializeGestureCallbacks(): void {
    Object.values(GestureType).forEach(gestureType => {
      this.gestureCallbacks.set(gestureType, []);
    });
  }

  /**
   * Register a touch target for interaction
   */
  public registerTouchTarget(target: TouchTarget): void {
    this.validateTouchTarget(target);
    this.touchTargets.set(target.id, target);
  }

  /**
   * Unregister a touch target
   */
  public unregisterTouchTarget(targetId: string): void {
    this.touchTargets.delete(targetId);
  }

  /**
   * Validate touch target meets accessibility requirements
   */
  private validateTouchTarget(target: TouchTarget): void {
    const minSize = this.config.minTouchTargetSize;
    
    if (target.width < minSize || target.height < minSize) {
      console.warn(`Touch target ${target.id} is below minimum size requirement (${minSize}px)`);
    }

    // Check spacing between targets
    this.touchTargets.forEach(existingTarget => {
      if (this.isTargetsTooClose(target, existingTarget)) {
        console.warn(`Touch targets ${target.id} and ${existingTarget.id} are too close together`);
      }
    });
  }

  /**
   * Check if two touch targets are too close together
   */
  private isTargetsTooClose(target1: TouchTarget, target2: TouchTarget): boolean {
    const minSpacing = this.config.spacingBetweenTargets;
    const distance = Math.sqrt(
      Math.pow(target1.x - target2.x, 2) + Math.pow(target1.y - target2.y, 2)
    );
    return distance < minSpacing;
  }

  /**
   * Handle touch start event
   */
  public handleTouchStart(touch: TouchPoint): void {
    if (!this.isEnabled) return;

    const startTime = this.performanceMonitor.startTiming('touch_start');
    this.activeTouches.set(touch.identifier, touch);
    
    this.gestureRecognizer.onTouchStart(touch);
    this.accessibilityManager.onTouchStart(touch);
    
    this.performanceMonitor.endTiming('touch_start', startTime);
  }

  /**
   * Handle touch move event
   */
  public handleTouchMove(touch: TouchPoint): void {
    if (!this.isEnabled) return;

    const startTime = this.performanceMonitor.startTiming('touch_move');
    this.activeTouches.set(touch.identifier, touch);
    
    const gestureState = this.gestureRecognizer.onTouchMove(touch);
    if (gestureState) {
      this.processGestureState(gestureState);
    }
    
    this.performanceMonitor.endTiming('touch_move', startTime);
  }

  /**
   * Handle touch end event
   */
  public handleTouchEnd(touch: TouchPoint): void {
    if (!this.isEnabled) return;

    const startTime = this.performanceMonitor.startTiming('touch_end');
    this.activeTouches.delete(touch.identifier);
    
    const gestureEvent = this.gestureRecognizer.onTouchEnd(touch);
    if (gestureEvent) {
      this.processGestureEvent(gestureEvent);
    }
    
    this.accessibilityManager.onTouchEnd(touch);
    this.performanceMonitor.endTiming('touch_end', startTime);
  }

  /**
   * Process gesture state during movement
   */
  private processGestureState(gestureState: any): void {
    // Provide real-time feedback during gesture
    if (gestureState.isActive) {
      this.feedbackManager.provideFeedback(TouchFeedbackType.VISUAL, gestureState);
    }
  }

  /**
   * Process completed gesture event
   */
  private processGestureEvent(gestureEvent: GestureEvent): void {
    const callbacks = this.gestureCallbacks.get(gestureEvent.type) || [];
    
    // Execute all registered callbacks
    callbacks.forEach(callback => {
      try {
        callback(gestureEvent);
      } catch (error) {
        console.error(`Error in gesture callback for ${gestureEvent.type}:`, error);
      }
    });

    // Provide feedback
    this.feedbackManager.provideFeedback(TouchFeedbackType.HAPTIC, gestureEvent);
    
    // Update performance metrics
    this.performanceMonitor.recordGesture(gestureEvent.type, true);
  }

  /**
   * Register callback for specific gesture type
   */
  public onGesture(gestureType: GestureType, callback: (event: GestureEvent) => void): void {
    const callbacks = this.gestureCallbacks.get(gestureType) || [];
    callbacks.push(callback);
    this.gestureCallbacks.set(gestureType, callbacks);
  }

  /**
   * Remove callback for specific gesture type
   */
  public offGesture(gestureType: GestureType, callback: (event: GestureEvent) => void): void {
    const callbacks = this.gestureCallbacks.get(gestureType) || [];
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
      this.gestureCallbacks.set(gestureType, callbacks);
    }
  }

  /**
   * Enable/disable touch controls
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.activeTouches.clear();
      this.gestureRecognizer.reset();
    }
  }

  /**
   * Get current performance metrics
   */
  public getPerformanceMetrics(): PerformanceMetrics {
    return this.performanceMonitor.getMetrics();
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<TouchControlConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.gestureRecognizer.updateConfig(this.config.gestureConfig);
    this.accessibilityManager.updateConfig(this.config.accessibility);
  }

  /**
   * Get accessibility status
   */
  public getAccessibilityStatus() {
    return this.accessibilityManager.getStatus();
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.activeTouches.clear();
    this.touchTargets.clear();
    this.gestureCallbacks.clear();
    this.gestureRecognizer.destroy();
    this.accessibilityManager.destroy();
    this.performanceMonitor.destroy();
    this.feedbackManager.destroy();
  }
}