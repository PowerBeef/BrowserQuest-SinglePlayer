/**
 * Touch Target Component
 * A specialized component for creating accessible touch targets
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  AccessibilityInfo,
  Platform,
  Animated
} from 'react-native';
import { TouchControlManager } from '../core/TouchControlManager';
import { TouchTarget as TouchTargetType, TouchPoint } from '../types/TouchTypes';

interface TouchTargetProps {
  id: string;
  onPress?: () => void;
  onLongPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  children?: React.ReactNode;
  text?: string;
  minSize?: number;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: string;
  testID?: string;
  hapticFeedback?: boolean;
  visualFeedback?: boolean;
  touchControlManager?: TouchControlManager;
}

export const TouchTarget: React.FC<TouchTargetProps> = ({
  id,
  onPress,
  onLongPress,
  onPressIn,
  onPressOut,
  style,
  textStyle,
  children,
  text,
  minSize = 44,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  testID,
  hapticFeedback = true,
  visualFeedback = true,
  touchControlManager
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isAccessibilityEnabled, setIsAccessibilityEnabled] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

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

  // Register touch target with manager
  useEffect(() => {
    if (touchControlManager) {
      const touchTarget: TouchTargetType = {
        id,
        x: 0, // Will be updated when component mounts
        y: 0,
        width: minSize,
        height: minSize,
        minSize,
        accessibilityLabel: accessibilityLabel || text,
        accessibilityHint,
        accessibilityRole
      };

      touchControlManager.registerTouchTarget(touchTarget);

      return () => {
        touchControlManager.unregisterTouchTarget(id);
      };
    }
  }, [touchControlManager, id, minSize, accessibilityLabel, accessibilityHint, accessibilityRole, text]);

  // Handle press in
  const handlePressIn = useCallback(() => {
    if (disabled) return;

    setIsPressed(true);
    onPressIn?.();

    if (visualFeedback) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.7,
          duration: 100,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [disabled, onPressIn, visualFeedback, scaleAnim, opacityAnim]);

  // Handle press out
  const handlePressOut = useCallback(() => {
    if (disabled) return;

    setIsPressed(false);
    onPressOut?.();

    if (visualFeedback) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [disabled, onPressOut, visualFeedback, scaleAnim, opacityAnim]);

  // Handle press
  const handlePress = useCallback(() => {
    if (disabled) return;

    onPress?.();
  }, [disabled, onPress]);

  // Handle long press
  const handleLongPress = useCallback(() => {
    if (disabled) return;

    onLongPress?.();
  }, [disabled, onLongPress]);

  // Get accessibility props
  const getAccessibilityProps = () => {
    const props: any = {
      accessibilityRole,
      accessibilityState: { disabled },
    };

    if (accessibilityLabel) {
      props.accessibilityLabel = accessibilityLabel;
    } else if (text) {
      props.accessibilityLabel = text;
    }

    if (accessibilityHint) {
      props.accessibilityHint = accessibilityHint;
    }

    if (isAccessibilityEnabled) {
      props.accessibilityActions = [
        { name: 'activate', label: 'Activate' },
        { name: 'longpress', label: 'Long press' }
      ];
    }

    return props;
  };

  // Get container style
  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      minWidth: minSize,
      minHeight: minSize,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 8,
      padding: 8,
    };

    if (disabled) {
      baseStyle.opacity = 0.5;
    }

    return StyleSheet.flatten([baseStyle, style]);
  };

  // Get text style
  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      textAlign: 'center',
      fontSize: 16,
      fontWeight: '500',
    };

    return StyleSheet.flatten([baseStyle, textStyle]);
  };

  return (
    <Animated.View
      style={[
        getContainerStyle(),
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        }
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        onLongPress={handleLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={visualFeedback ? 0.7 : 1}
        style={styles.touchable}
        {...getAccessibilityProps()}
        testID={testID}
      >
        {children || (text && <Text style={getTextStyle()}>{text}</Text>)}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  touchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
});

export default TouchTarget;