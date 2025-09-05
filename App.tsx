/**
 * Mobile Touch Controls Demo App
 * Comprehensive demonstration of touch control features
 */

import React, { useState, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  Alert,
  Switch,
  Dimensions,
  StatusBar,
} from 'react-native';
import { TouchControlView } from './src/components/TouchControlView';
import { TouchTarget } from './src/components/TouchTarget';
import { useTouchControls } from './src/hooks/useTouchControls';
import { GestureEvent, GestureType, TouchPoint } from './src/types/TouchTypes';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const App: React.FC = () => {
  const [gestureHistory, setGestureHistory] = useState<GestureEvent[]>([]);
  const [isEnabled, setIsEnabled] = useState(true);
  const [showPerformanceMetrics, setShowPerformanceMetrics] = useState(false);
  const [accessibilityEnabled, setAccessibilityEnabled] = useState(false);

  // Initialize touch controls
  const {
    touchControlManager,
    performanceMetrics,
    setEnabled,
    getAccessibilityStatus,
  } = useTouchControls({
    config: {
      minTouchTargetSize: 44,
      spacingBetweenTargets: 8,
      gestureConfig: {
        minDistance: 10,
        maxDistance: 1000,
        minDuration: 100,
        maxDuration: 2000,
        velocityThreshold: 0.3,
        scaleThreshold: 0.1,
        rotationThreshold: 15,
      },
      accessibility: {
        screenReaderEnabled: accessibilityEnabled,
        voiceControlEnabled: accessibilityEnabled,
        switchControlEnabled: accessibilityEnabled,
        highContrastEnabled: false,
        reducedMotionEnabled: false,
        largeTextEnabled: false,
      },
    },
    onGesture: handleGesture,
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  });

  // Handle gesture recognition
  function handleGesture(gestureEvent: GestureEvent): void {
    console.log('Gesture recognized:', gestureEvent.type);
    
    setGestureHistory(prev => [gestureEvent, ...prev.slice(0, 9)]); // Keep last 10 gestures
    
    // Show gesture-specific feedback
    switch (gestureEvent.type) {
      case GestureType.TAP:
        Alert.alert('Tap Detected', 'Single tap gesture recognized!');
        break;
      case GestureType.DOUBLE_TAP:
        Alert.alert('Double Tap Detected', 'Double tap gesture recognized!');
        break;
      case GestureType.LONG_PRESS:
        Alert.alert('Long Press Detected', 'Long press gesture recognized!');
        break;
      case GestureType.SWIPE_LEFT:
        Alert.alert('Swipe Left', 'Left swipe gesture recognized!');
        break;
      case GestureType.SWIPE_RIGHT:
        Alert.alert('Swipe Right', 'Right swipe gesture recognized!');
        break;
      case GestureType.SWIPE_UP:
        Alert.alert('Swipe Up', 'Up swipe gesture recognized!');
        break;
      case GestureType.SWIPE_DOWN:
        Alert.alert('Swipe Down', 'Down swipe gesture recognized!');
        break;
      case GestureType.PINCH:
        Alert.alert('Pinch Detected', 'Pinch gesture recognized!');
        break;
      case GestureType.ROTATE:
        Alert.alert('Rotate Detected', 'Rotation gesture recognized!');
        break;
    }
  }

  // Handle touch events
  function handleTouchStart(touch: TouchPoint): void {
    console.log('Touch start:', touch);
  }

  function handleTouchMove(touch: TouchPoint): void {
    console.log('Touch move:', touch);
  }

  function handleTouchEnd(touch: TouchPoint): void {
    console.log('Touch end:', touch);
  }

  // Toggle touch controls
  const toggleTouchControls = useCallback(() => {
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);
    setEnabled(newEnabled);
  }, [isEnabled, setEnabled]);

  // Clear gesture history
  const clearHistory = useCallback(() => {
    setGestureHistory([]);
  }, []);

  // Get accessibility status
  const accessibilityStatus = getAccessibilityStatus();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Mobile Touch Controls</Text>
          <Text style={styles.subtitle}>Comprehensive Touch Control Demo</Text>
        </View>

        {/* Controls */}
        <View style={styles.controlsSection}>
          <Text style={styles.sectionTitle}>Controls</Text>
          
          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>Touch Controls</Text>
            <Switch
              value={isEnabled}
              onValueChange={toggleTouchControls}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={isEnabled ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>

          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>Accessibility</Text>
            <Switch
              value={accessibilityEnabled}
              onValueChange={setAccessibilityEnabled}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={accessibilityEnabled ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>

          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>Performance Metrics</Text>
            <Switch
              value={showPerformanceMetrics}
              onValueChange={setShowPerformanceMetrics}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={showPerformanceMetrics ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Touch Target Demo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Touch Target Demo</Text>
          <Text style={styles.sectionDescription}>
            Tap the buttons below to test different touch target sizes and accessibility features.
          </Text>
          
          <View style={styles.touchTargetGrid}>
            <TouchTarget
              id="small-target"
              text="Small"
              minSize={32}
              onPress={() => Alert.alert('Small Target', 'Small target tapped!')}
              accessibilityLabel="Small touch target"
              accessibilityHint="Tap to test small target size"
              touchControlManager={touchControlManager}
            />
            
            <TouchTarget
              id="medium-target"
              text="Medium"
              minSize={44}
              onPress={() => Alert.alert('Medium Target', 'Medium target tapped!')}
              accessibilityLabel="Medium touch target"
              accessibilityHint="Tap to test medium target size"
              touchControlManager={touchControlManager}
            />
            
            <TouchTarget
              id="large-target"
              text="Large"
              minSize={60}
              onPress={() => Alert.alert('Large Target', 'Large target tapped!')}
              accessibilityLabel="Large touch target"
              accessibilityHint="Tap to test large target size"
              touchControlManager={touchControlManager}
            />
          </View>
        </View>

        {/* Gesture Recognition Demo */}
        <TouchControlView
          style={styles.gestureDemo}
          onGesture={handleGesture}
          accessibilityLabel="Gesture recognition area"
          accessibilityHint="Perform gestures like tap, swipe, pinch, or rotate"
          touchControlManager={touchControlManager}
        >
          <View style={styles.gestureArea}>
            <Text style={styles.gestureTitle}>Gesture Recognition Area</Text>
            <Text style={styles.gestureDescription}>
              Try these gestures:{'\n'}
              • Single tap{'\n'}
              • Double tap{'\n'}
              • Long press{'\n'}
              • Swipe in any direction{'\n'}
              • Pinch to zoom{'\n'}
              • Rotate with two fingers
            </Text>
          </View>
        </TouchControlView>

        {/* Performance Metrics */}
        {showPerformanceMetrics && performanceMetrics && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance Metrics</Text>
            
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Recognition Time</Text>
                <Text style={styles.metricValue}>
                  {performanceMetrics.gestureRecognitionTime.toFixed(1)}ms
                </Text>
              </View>
              
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Memory Usage</Text>
                <Text style={styles.metricValue}>
                  {performanceMetrics.memoryUsage.toFixed(1)}MB
                </Text>
              </View>
              
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Battery Impact</Text>
                <Text style={styles.metricValue}>
                  {(performanceMetrics.batteryImpact * 100).toFixed(1)}%
                </Text>
              </View>
              
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Success Rate</Text>
                <Text style={styles.metricValue}>
                  {(performanceMetrics.successRate * 100).toFixed(1)}%
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Accessibility Status */}
        {accessibilityEnabled && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Accessibility Status</Text>
            
            <View style={styles.accessibilityGrid}>
              <View style={styles.accessibilityItem}>
                <Text style={styles.accessibilityLabel}>Screen Reader</Text>
                <Text style={styles.accessibilityValue}>
                  {accessibilityStatus?.screenReaderEnabled ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
              
              <View style={styles.accessibilityItem}>
                <Text style={styles.accessibilityLabel}>Voice Control</Text>
                <Text style={styles.accessibilityValue}>
                  {accessibilityStatus?.voiceControlEnabled ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
              
              <View style={styles.accessibilityItem}>
                <Text style={styles.accessibilityLabel}>Switch Control</Text>
                <Text style={styles.accessibilityValue}>
                  {accessibilityStatus?.switchControlEnabled ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Gesture History */}
        <View style={styles.section}>
          <View style={styles.historyHeader}>
            <Text style={styles.sectionTitle}>Gesture History</Text>
            <TouchTarget
              id="clear-history"
              text="Clear"
              minSize={44}
              onPress={clearHistory}
              accessibilityLabel="Clear gesture history"
              accessibilityHint="Tap to clear the gesture history"
              touchControlManager={touchControlManager}
            />
          </View>
          
          {gestureHistory.length === 0 ? (
            <Text style={styles.emptyHistory}>No gestures detected yet</Text>
          ) : (
            <View style={styles.historyList}>
              {gestureHistory.map((gesture, index) => (
                <View key={index} style={styles.historyItem}>
                  <Text style={styles.historyGesture}>
                    {gesture.type.replace('_', ' ').toUpperCase()}
                  </Text>
                  <Text style={styles.historyTime}>
                    {new Date(gesture.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Mobile Touch Controls Demo{'\n'}
            Built with React Native and TypeScript
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
  },
  controlsSection: {
    padding: 20,
    backgroundColor: '#ffffff',
    marginTop: 10,
  },
  section: {
    padding: 20,
    backgroundColor: '#ffffff',
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 16,
    lineHeight: 20,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  controlLabel: {
    fontSize: 16,
    color: '#212529',
  },
  touchTargetGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
  },
  gestureDemo: {
    height: 200,
    backgroundColor: '#e3f2fd',
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2196f3',
    borderStyle: 'dashed',
  },
  gestureArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  gestureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 8,
    textAlign: 'center',
  },
  gestureDescription: {
    fontSize: 14,
    color: '#1976d2',
    textAlign: 'center',
    lineHeight: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  accessibilityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  accessibilityItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  accessibilityLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  accessibilityValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#28a745',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyHistory: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  historyList: {
    gap: 8,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  historyGesture: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212529',
  },
  historyTime: {
    fontSize: 12,
    color: '#6c757d',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginTop: 10,
  },
  footerText: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default App;