/**
 * Feedback Manager
 * Handles visual, haptic, and audio feedback for touch interactions
 */

import { 
  TouchFeedbackType, 
  GestureEvent, 
  GestureState 
} from '../types/TouchTypes';

export class FeedbackManager {
  private hapticEnabled: boolean = true;
  private audioEnabled: boolean = true;
  private visualEnabled: boolean = true;
  private feedbackIntensity: number = 1.0; // 0.0 to 1.0
  private customFeedbackCallbacks: Map<TouchFeedbackType, Function[]> = new Map();

  constructor() {
    this.initializeFeedbackCallbacks();
  }

  /**
   * Initialize feedback callback maps
   */
  private initializeFeedbackCallbacks(): void {
    Object.values(TouchFeedbackType).forEach(feedbackType => {
      this.customFeedbackCallbacks.set(feedbackType, []);
    });
  }

  /**
   * Provide feedback for touch interaction
   */
  public provideFeedback(
    feedbackType: TouchFeedbackType, 
    data: GestureEvent | GestureState | any
  ): void {
    switch (feedbackType) {
      case TouchFeedbackType.VISUAL:
        this.provideVisualFeedback(data);
        break;
      case TouchFeedbackType.HAPTIC:
        this.provideHapticFeedback(data);
        break;
      case TouchFeedbackType.AUDIO:
        this.provideAudioFeedback(data);
        break;
    }

    // Execute custom callbacks
    const callbacks = this.customFeedbackCallbacks.get(feedbackType) || [];
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in feedback callback for ${feedbackType}:`, error);
      }
    });
  }

  /**
   * Provide visual feedback
   */
  private provideVisualFeedback(data: GestureEvent | GestureState | any): void {
    if (!this.visualEnabled) return;

    // This would typically trigger visual animations or effects
    // For now, we'll log the visual feedback
    console.log('Visual feedback:', data);
  }

  /**
   * Provide haptic feedback
   */
  private provideHapticFeedback(data: GestureEvent | GestureState | any): void {
    if (!this.hapticEnabled) return;

    const hapticType = this.getHapticTypeForData(data);
    this.triggerHapticFeedback(hapticType);
  }

  /**
   * Provide audio feedback
   */
  private provideAudioFeedback(data: GestureEvent | GestureState | any): void {
    if (!this.audioEnabled) return;

    const audioType = this.getAudioTypeForData(data);
    this.triggerAudioFeedback(audioType);
  }

  /**
   * Get haptic feedback type based on interaction data
   */
  private getHapticTypeForData(data: GestureEvent | GestureState | any): HapticType {
    if ('type' in data) {
      // GestureEvent
      switch (data.type) {
        case 'tap':
          return HapticType.LIGHT;
        case 'double_tap':
          return HapticType.MEDIUM;
        case 'long_press':
          return HapticType.HEAVY;
        case 'swipe_left':
        case 'swipe_right':
        case 'swipe_up':
        case 'swipe_down':
          return HapticType.SELECTION;
        case 'pinch':
          return HapticType.IMPACT;
        case 'rotate':
          return HapticType.ROTATION;
        default:
          return HapticType.LIGHT;
      }
    } else if ('isActive' in data) {
      // GestureState
      return data.isActive ? HapticType.SELECTION : HapticType.LIGHT;
    }

    return HapticType.LIGHT;
  }

  /**
   * Get audio feedback type based on interaction data
   */
  private getAudioTypeForData(data: GestureEvent | GestureState | any): AudioType {
    if ('type' in data) {
      // GestureEvent
      switch (data.type) {
        case 'tap':
          return AudioType.TAP;
        case 'double_tap':
          return AudioType.DOUBLE_TAP;
        case 'long_press':
          return AudioType.LONG_PRESS;
        case 'swipe_left':
        case 'swipe_right':
        case 'swipe_up':
        case 'swipe_down':
          return AudioType.SWIPE;
        case 'pinch':
          return AudioType.PINCH;
        case 'rotate':
          return AudioType.ROTATE;
        default:
          return AudioType.TAP;
      }
    }

    return AudioType.TAP;
  }

  /**
   * Trigger haptic feedback
   */
  private triggerHapticFeedback(hapticType: HapticType): void {
    // This would interface with platform-specific haptic APIs
    // For React Native, you might use react-native-haptic-feedback
    console.log(`Haptic feedback: ${hapticType} (intensity: ${this.feedbackIntensity})`);
  }

  /**
   * Trigger audio feedback
   */
  private triggerAudioFeedback(audioType: AudioType): void {
    // This would interface with platform-specific audio APIs
    // For React Native, you might use react-native-sound
    console.log(`Audio feedback: ${audioType}`);
  }

  /**
   * Register custom feedback callback
   */
  public onFeedback(feedbackType: TouchFeedbackType, callback: Function): void {
    const callbacks = this.customFeedbackCallbacks.get(feedbackType) || [];
    callbacks.push(callback);
    this.customFeedbackCallbacks.set(feedbackType, callbacks);
  }

  /**
   * Remove custom feedback callback
   */
  public offFeedback(feedbackType: TouchFeedbackType, callback: Function): void {
    const callbacks = this.customFeedbackCallbacks.get(feedbackType) || [];
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
      this.customFeedbackCallbacks.set(feedbackType, callbacks);
    }
  }

  /**
   * Enable/disable specific feedback types
   */
  public setHapticEnabled(enabled: boolean): void {
    this.hapticEnabled = enabled;
  }

  public setAudioEnabled(enabled: boolean): void {
    this.audioEnabled = enabled;
  }

  public setVisualEnabled(enabled: boolean): void {
    this.visualEnabled = enabled;
  }

  /**
   * Set feedback intensity (0.0 to 1.0)
   */
  public setFeedbackIntensity(intensity: number): void {
    this.feedbackIntensity = Math.max(0, Math.min(1, intensity));
  }

  /**
   * Get current feedback settings
   */
  public getFeedbackSettings() {
    return {
      hapticEnabled: this.hapticEnabled,
      audioEnabled: this.audioEnabled,
      visualEnabled: this.visualEnabled,
      feedbackIntensity: this.feedbackIntensity
    };
  }

  /**
   * Provide success feedback
   */
  public provideSuccessFeedback(): void {
    this.provideHapticFeedback({ type: 'success' });
    this.provideAudioFeedback({ type: 'success' });
  }

  /**
   * Provide error feedback
   */
  public provideErrorFeedback(): void {
    this.provideHapticFeedback({ type: 'error' });
    this.provideAudioFeedback({ type: 'error' });
  }

  /**
   * Provide warning feedback
   */
  public provideWarningFeedback(): void {
    this.provideHapticFeedback({ type: 'warning' });
    this.provideAudioFeedback({ type: 'warning' });
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.customFeedbackCallbacks.clear();
  }
}

/**
 * Haptic feedback types
 */
export enum HapticType {
  LIGHT = 'light',
  MEDIUM = 'medium',
  HEAVY = 'heavy',
  SELECTION = 'selection',
  IMPACT = 'impact',
  ROTATION = 'rotation',
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning'
}

/**
 * Audio feedback types
 */
export enum AudioType {
  TAP = 'tap',
  DOUBLE_TAP = 'double_tap',
  LONG_PRESS = 'long_press',
  SWIPE = 'swipe',
  PINCH = 'pinch',
  ROTATE = 'rotate',
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning'
}