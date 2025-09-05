/**
 * Touch Control View Component
 * React Native component that provides touch control functionality
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  View,
  PanResponder,
  Dimensions,
  StyleSheet,
  ViewStyle,
  AccessibilityInfo,
  Platform
} from 'react-native';
import { TouchControlManager } from '../core/TouchControlManager';
import { 
  TouchControlConfig, 
  TouchPoint, 
  GestureEvent, 
  GestureType,
  TouchTarget,
  AccessibilityConfig
} from '../types/TouchTypes';

interface TouchControlViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onGesture?: (gestureEvent: GestureEvent) => void;
  onTouchStart?: (touch: TouchPoint) => void;
  onTouchMove?: (touch: TouchPoint) => void;
  onTouchEnd?: (touch: TouchPoint) => void;
  config?: Partial<TouchControlConfig>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: string;
  testID?: string;
}

export const TouchControlView: React.FC<TouchControlViewProps> = ({
  children,
  style,
  onGesture,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  config,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  testID
}) => {
  const touchControlManagerRef = useRef<TouchControlManager | null>(null);
  const [isAccessibilityEnabled, setIsAccessibilityEnabled] = useState(false);
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));

  // Default configuration
  const defaultConfig: TouchControlConfig = {
    platform: Platform.OS as 'ios' | 'android' | 'web',
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

    // Set up gesture callbacks
    if (onGesture) {
      Object.values(GestureType).forEach(gestureType => {
        touchControlManagerRef.current?.onGesture(gestureType, onGesture);
      });
    }

    return () => {
      touchControlManagerRef.current?.destroy();
    };
  }, [finalConfig, onGesture]);

  // Check accessibility status
  useEffect(() => {
    const checkAccessibility = async () => {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        const isEnabled = await AccessibilityInfo.isScreenReaderEnabled();
        setIsAccessibilityEnabled(isEnabled);
      }
    };

    checkAccessibility();

    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsAccessibilityEnabled
    );

    return () => subscription?.remove();
  }, []);

  // Handle screen dimension changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  // Convert React Native touch event to TouchPoint
  const convertToTouchPoint = useCallback((event: any): TouchPoint => {
    const { pageX, pageY, timestamp, force, identifier } = event.nativeEvent;
    return {
      x: pageX,
      y: pageY,
      timestamp: timestamp || Date.now(),
      pressure: force || 0,
      identifier: identifier || 0
    };
  }, []);

  // Create touch target for this view
  const createTouchTarget = useCallback((): TouchTarget => {
    return {
      id: 'touch-control-view',
      x: 0,
      y: 0,
      width: screenDimensions.width,
      height: screenDimensions.height,
      minSize: finalConfig.minTouchTargetSize,
      accessibilityLabel,
      accessibilityHint,
      accessibilityRole
    };
  }, [screenDimensions, finalConfig.minTouchTargetSize, accessibilityLabel, accessibilityHint, accessibilityRole]);

  // Register touch target
  useEffect(() => {
    if (touchControlManagerRef.current) {
      const touchTarget = createTouchTarget();
      touchControlManagerRef.current.registerTouchTarget(touchTarget);
    }
  }, [createTouchTarget]);

  // Pan responder for touch handling
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,

    onPanResponderGrant: (event) => {
      const touch = convertToTouchPoint(event);
      touchControlManagerRef.current?.handleTouchStart(touch);
      onTouchStart?.(touch);
    },

    onPanResponderMove: (event) => {
      const touch = convertToTouchPoint(event);
      touchControlManagerRef.current?.handleTouchMove(touch);
      onTouchMove?.(touch);
    },

    onPanResponderRelease: (event) => {
      const touch = convertToTouchPoint(event);
      touchControlManagerRef.current?.handleTouchEnd(touch);
      onTouchEnd?.(touch);
    },

    onPanResponderTerminate: (event) => {
      const touch = convertToTouchPoint(event);
      touchControlManagerRef.current?.handleTouchEnd(touch);
      onTouchEnd?.(touch);
    }
  });

  // Get accessibility props
  const getAccessibilityProps = () => {
    const props: any = {};

    if (accessibilityLabel) {
      props.accessibilityLabel = accessibilityLabel;
    }

    if (accessibilityHint) {
      props.accessibilityHint = accessibilityHint;
    }

    if (accessibilityRole) {
      props.accessibilityRole = accessibilityRole;
    }

    if (isAccessibilityEnabled) {
      props.accessibilityState = { disabled: false };
    }

    return props;
  };

  return (
    <View
      style={[styles.container, style]}
      {...panResponder.panHandlers}
      {...getAccessibilityProps()}
      testID={testID}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default TouchControlView;