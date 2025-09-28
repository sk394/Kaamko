import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Dimensions,
  Animated,
  PanResponder,
  Alert,
} from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BlurView } from 'expo-blur';
import { SessionObject } from '../types';
import { calculateHours } from '../utils/timeUtils';
import { AppColors } from '../theme/colors';

const { height: screenHeight } = Dimensions.get('window');

interface SessionDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onAddSession: (session: SessionObject) => void;
}

const SessionDialog: React.FC<SessionDialogProps> = ({
  visible,
  onDismiss,
  onAddSession,
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [clockInTime, setClockInTime] = useState(new Date());
  const [clockOutTime, setClockOutTime] = useState(() => {
    const now = new Date();
    return new Date(now.getTime() + 60 * 60 * 1000); // 1 hour later
  });

  const [slideAnim] = useState(new Animated.Value(screenHeight));
  const [scaleAnim] = useState(new Animated.Value(0.85));
  const [opacityAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      // Pop-up animation with scale and slide
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.85,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, scaleAnim, opacityAnim]);

  // Pan responder for drag-to-close functionality
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      // Only respond to vertical drags with minimum movement
      return (
        Math.abs(gestureState.dy) > Math.abs(gestureState.dx) &&
        Math.abs(gestureState.dy) > 5
      );
    },
    onPanResponderGrant: () => {
      // Stop any ongoing animations when user starts dragging
      slideAnim.stopAnimation();
      opacityAnim.stopAnimation();
    },
    onPanResponderMove: (_, gestureState) => {
      // Only allow downward movement
      if (gestureState.dy > 0) {
        slideAnim.setValue(gestureState.dy);
        // Add some opacity fade as user drags
        const progress = Math.min(gestureState.dy / 200, 0.4);
        opacityAnim.setValue(1 - progress);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      const shouldClose =
        gestureState.dy > 120 ||
        (gestureState.dy > 50 && gestureState.vy > 0.8);

      if (shouldClose) {
        // Animate to close
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: screenHeight,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onDismiss();
        });
      } else {
        // Snap back to original position
        Animated.parallel([
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }
    },
    onPanResponderTerminate: () => {
      // If gesture is interrupted, snap back
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    },
  });

  const validateTimes = useCallback(() => {
    const clockInDateTime = new Date(selectedDate);
    clockInDateTime.setHours(
      clockInTime.getHours(),
      clockInTime.getMinutes(),
      0,
      0
    );

    const clockOutDateTime = new Date(selectedDate);
    clockOutDateTime.setHours(
      clockOutTime.getHours(),
      clockOutTime.getMinutes(),
      0,
      0
    );

    // Check if clock out is after clock in
    if (clockOutDateTime <= clockInDateTime) {
      Alert.alert(
        'Invalid Time Range',
        'Clock out time must be after clock in time.',
        [{ text: 'OK' }]
      );
      return false;
    }

    // Check if the session is longer than 24 hours
    const diffInHours =
      (clockOutDateTime.getTime() - clockInDateTime.getTime()) /
      (1000 * 60 * 60);
    if (diffInHours > 24) {
      Alert.alert(
        'Invalid Duration',
        'Session duration cannot exceed 24 hours.',
        [{ text: 'OK' }]
      );
      return false;
    }

    // Check if clock in time is in the future
    const now = new Date();
    if (clockInDateTime > now) {
      Alert.alert('Invalid Time', 'Clock in time cannot be in the future.', [
        { text: 'OK' },
      ]);
      return false;
    }

    return true;
  }, [selectedDate, clockInTime, clockOutTime]);

  const handleSubmit = useCallback(() => {
    if (!validateTimes()) {
      return;
    }

    // Create session object
    const clockInDateTime = new Date(selectedDate);
    clockInDateTime.setHours(
      clockInTime.getHours(),
      clockInTime.getMinutes(),
      0,
      0
    );

    const clockOutDateTime = new Date(selectedDate);
    clockOutDateTime.setHours(
      clockOutTime.getHours(),
      clockOutTime.getMinutes(),
      0,
      0
    );

    const hours = calculateHours(
      clockInDateTime.toISOString(),
      clockOutDateTime.toISOString()
    );

    const session: SessionObject = {
      id: `manual-session-${Date.now()}`,
      date:
        selectedDate.getFullYear() +
        '-' +
        String(selectedDate.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(selectedDate.getDate()).padStart(2, '0'),
      clockIn: clockInDateTime.toISOString(),
      clockOut: clockOutDateTime.toISOString(),
      hours,
    };

    onAddSession(session);
    onDismiss();
  }, [
    selectedDate,
    clockInTime,
    clockOutTime,
    onAddSession,
    onDismiss,
    validateTimes,
  ]);

  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      onRequestClose={onDismiss}
      animationType="none">
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <Animated.View
          style={[
            styles.bottomSheet,
            {
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}>
          <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
            {/* Draggable handle area */}
            <View style={styles.handleArea} {...panResponder.panHandlers}>
              <View style={styles.handle} />
            </View>

            <Text style={styles.title}>Add Manual Session</Text>

            {/* Date Picker */}
            <View style={styles.row}>
              <Text style={styles.label}>Date</Text>
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="default"
                  onChange={(event, date) => date && setSelectedDate(date)}
                  maximumDate={new Date()}
                />
              </View>
            </View>

            {/* Time Pickers Row */}
            <View style={styles.timeRow}>
              <View style={styles.timeColumn}>
                <Text style={styles.label}>Clock In</Text>
                <View style={styles.pickerContainer}>
                  <DateTimePicker
                    value={clockInTime}
                    mode="time"
                    display="default"
                    onChange={(event, time) => time && setClockInTime(time)}
                  />
                </View>
              </View>

              <View style={styles.timeColumn}>
                <Text style={styles.label}>Clock Out</Text>
                <View style={styles.pickerContainer}>
                  <DateTimePicker
                    value={clockOutTime}
                    mode="time"
                    display="default"
                    onChange={(event, time) => time && setClockOutTime(time)}
                  />
                </View>
              </View>
            </View>

            {/* Hours Preview */}
            <View style={styles.previewRow}>
              <Text style={styles.hoursText}>
                Total:{' '}
                {(() => {
                  const clockInDateTime = new Date(selectedDate);
                  clockInDateTime.setHours(
                    clockInTime.getHours(),
                    clockInTime.getMinutes(),
                    0,
                    0
                  );

                  const clockOutDateTime = new Date(selectedDate);
                  clockOutDateTime.setHours(
                    clockOutTime.getHours(),
                    clockOutTime.getMinutes(),
                    0,
                    0
                  );

                  const hours = calculateHours(
                    clockInDateTime.toISOString(),
                    clockOutDateTime.toISOString()
                  );

                  // Show warning for invalid times
                  if (clockOutDateTime <= clockInDateTime) {
                    return 'Invalid time range';
                  }

                  return hours.toFixed(2);
                })()}{' '}
                hours
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <Button
                mode="outlined"
                onPress={onDismiss}
                style={styles.cancelButton}
                textColor="#fff">
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSubmit}
                style={styles.submitButton}>
                Add Session
              </Button>
            </View>
          </BlurView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Darker overlay for better blur effect
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: 400,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden', // Ensure blur view stays within rounded corners
  },
  blurContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    flex: 1,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#9ca3af',
    borderRadius: 2,
    alignSelf: 'center',
  },
  handleArea: {
    paddingVertical: 16,
    paddingHorizontal: 50,
    marginTop: -4,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
  },
  row: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 4,
    marginStart: 10,
    marginEnd: 10,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeColumn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 4,
  },
  pickerContainer: {
    borderRadius: 12,
    paddingVertical: 4,
  },
  previewRow: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 12,
  },
  hoursText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#93c5fd',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 12,
    borderColor: '#9ca3af',
  },
  submitButton: {
    flex: 1,
    backgroundColor: AppColors.primary,
    borderRadius: 12,
  },
});

export default SessionDialog;
