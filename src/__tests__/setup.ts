/**
 * Jest setup file for touch controls testing
 */

import 'react-native-gesture-handler/jestSetup';

// Mock react-native modules
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock performance API
global.performance = {
  now: jest.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 1024 * 1024 * 10, // 10MB
  },
} as any;

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock AccessibilityInfo
jest.mock('react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo', () => ({
  isScreenReaderEnabled: jest.fn(() => Promise.resolve(false)),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  removeEventListener: jest.fn(),
}));

// Mock Dimensions
jest.mock('react-native/Libraries/Utilities/Dimensions', () => ({
  get: jest.fn(() => ({ width: 375, height: 812 })),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  removeEventListener: jest.fn(),
}));

// Mock Platform
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn((obj) => obj.ios),
}));

// Mock PanResponder
jest.mock('react-native/Libraries/Interaction/PanResponder', () => ({
  create: jest.fn(() => ({
    panHandlers: {},
  })),
}));

// Mock TouchableOpacity
jest.mock('react-native/Libraries/Components/Touchable/TouchableOpacity', () => {
  const React = require('react');
  return React.forwardRef((props: any, ref: any) => {
    return React.createElement('TouchableOpacity', { ...props, ref });
  });
});

// Mock Animated
jest.mock('react-native/Libraries/Animated/Animated', () => {
  const React = require('react');
  const Animated = {
    View: React.forwardRef((props: any, ref: any) => {
      return React.createElement('AnimatedView', { ...props, ref });
    }),
    Value: jest.fn(() => ({
      setValue: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      removeAllListeners: jest.fn(),
      stopAnimation: jest.fn(),
      setOffset: jest.fn(),
      flattenOffset: jest.fn(),
      extractOffset: jest.fn(),
      resetAnimation: jest.fn(),
      interpolate: jest.fn(),
      animate: jest.fn(),
      timing: jest.fn(() => ({
        start: jest.fn(),
        stop: jest.fn(),
      })),
      parallel: jest.fn(() => ({
        start: jest.fn(),
        stop: jest.fn(),
      })),
    })),
    timing: jest.fn(() => ({
      start: jest.fn(),
      stop: jest.fn(),
    })),
    parallel: jest.fn(() => ({
      start: jest.fn(),
      stop: jest.fn(),
    })),
  };
  return Animated;
});

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  return {
    GestureHandlerRootView: React.forwardRef((props: any, ref: any) => {
      return React.createElement('GestureHandlerRootView', { ...props, ref });
    }),
    TapGestureHandler: React.forwardRef((props: any, ref: any) => {
      return React.createElement('TapGestureHandler', { ...props, ref });
    }),
    PanGestureHandler: React.forwardRef((props: any, ref: any) => {
      return React.createElement('PanGestureHandler', { ...props, ref });
    }),
    PinchGestureHandler: React.forwardRef((props: any, ref: any) => {
      return React.createElement('PinchGestureHandler', { ...props, ref });
    }),
    RotationGestureHandler: React.forwardRef((props: any, ref: any) => {
      return React.createElement('RotationGestureHandler', { ...props, ref });
    }),
  };
});

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: any) => children,
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

// Mock react-native-screens
jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
}));

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

// Mock react-native-haptic-feedback
jest.mock('react-native-haptic-feedback', () => ({
  trigger: jest.fn(),
}));

// Mock react-native-sound
jest.mock('react-native-sound', () => ({
  Sound: jest.fn(),
}));

// Mock react-native-device-info
jest.mock('react-native-device-info', () => ({
  getModel: jest.fn(() => 'iPhone'),
  getSystemVersion: jest.fn(() => '14.0'),
  isTablet: jest.fn(() => false),
}));

// Mock react-native-orientation-locker
jest.mock('react-native-orientation-locker', () => ({
  getOrientation: jest.fn(() => Promise.resolve('PORTRAIT')),
  lockToPortrait: jest.fn(),
  lockToLandscape: jest.fn(),
  unlockAllOrientations: jest.fn(),
}));

// Mock react-native-permissions
jest.mock('react-native-permissions', () => ({
  request: jest.fn(() => Promise.resolve('granted')),
  check: jest.fn(() => Promise.resolve('granted')),
  PERMISSIONS: {
    CAMERA: 'camera',
    MICROPHONE: 'microphone',
  },
  RESULTS: {
    UNAVAILABLE: 'unavailable',
    DENIED: 'denied',
    LIMITED: 'limited',
    GRANTED: 'granted',
    BLOCKED: 'blocked',
  },
}));

// Setup global test environment
beforeEach(() => {
  jest.clearAllMocks();
});

// Global test utilities
global.testUtils = {
  createMockTouchPoint: (x: number = 100, y: number = 100, identifier: number = 1) => ({
    x,
    y,
    timestamp: Date.now(),
    identifier,
    pressure: 0.5,
  }),
  
  createMockTouchTarget: (id: string = 'test-target', x: number = 0, y: number = 0, width: number = 50, height: number = 50) => ({
    id,
    x,
    y,
    width,
    height,
    minSize: Math.min(width, height),
    accessibilityLabel: `Test Target ${id}`,
    accessibilityRole: 'button',
  }),
  
  createMockGestureState: (deltaX: number = 0, deltaY: number = 0) => ({
    startTime: Date.now() - 100,
    startTouches: [],
    currentTouches: [],
    deltaX,
    deltaY,
    velocityX: 0,
    velocityY: 0,
    scale: 1,
    rotation: 0,
    isActive: true,
    isRecognized: false,
  }),
};