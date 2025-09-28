import React, { useRef, useEffect } from 'react';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { AppColors } from '../theme/colors';

interface AnimatedClockButtonProps {
  isClocked: boolean;
  onClockIn: () => void;
  onClockOut: () => void;
  disabled?: boolean;
  workedMinutes?: number; // total minutes worked (live or last session)
}

const SWIPE_THRESHOLD = 60;

export const AnimatedClockButton: React.FC<AnimatedClockButtonProps> = ({
  isClocked,
  onClockIn,
  onClockOut,
  disabled,
  workedMinutes = 0,
}) => {
  const pan = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const pressed = useRef(false);

  // Animate scale on swipe
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  }, [isClocked]);

  // Heartbeat animation
  useEffect(() => {
    let isMounted = true;
    const beat = () => {
      if (!isMounted) return;
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.12,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (isMounted) setTimeout(beat, 700);
      });
    };
    beat();
    return () => {
      isMounted = false;
    };
  }, []);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !disabled,
    onPanResponderMove: (_, gestureState) => {
      pan.setValue(gestureState.dy);
      scale.setValue(1 + Math.abs(gestureState.dy) / 300);
    },
    onPanResponderRelease: (_, gestureState) => {
      if (!pressed.current) {
        if (!isClocked && gestureState.dy < -SWIPE_THRESHOLD) {
          pressed.current = true;
          Animated.spring(pan, { toValue: -100, useNativeDriver: true }).start(
            () => {
              onClockIn();
              pan.setValue(0);
              scale.setValue(1);
              pressed.current = false;
            }
          );
        } else if (isClocked && gestureState.dy > SWIPE_THRESHOLD) {
          pressed.current = true;
          Animated.spring(pan, { toValue: 100, useNativeDriver: true }).start(
            () => {
              onClockOut();
              pan.setValue(0);
              scale.setValue(1);
              pressed.current = false;
            }
          );
        } else {
          Animated.spring(pan, { toValue: 0, useNativeDriver: true }).start();
          Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
        }
      }
    },
    onPanResponderTerminate: () => {
      Animated.spring(pan, { toValue: 0, useNativeDriver: true }).start();
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
    },
  });

  return (
    <View style={styles.center}>
      <Animated.View
        style={[
          styles.clockButton,
          {
            transform: [{ translateY: pan }, { scale }],
            backgroundColor: isClocked ? AppColors.error : AppColors.primary,
            opacity: disabled ? 0.6 : 1,
            shadowColor: isClocked ? AppColors.error : AppColors.primary,
          },
        ]}
        {...panResponder.panHandlers}>
        <Text style={styles.timeText}>Clock In</Text>
        <Text style={styles.swipeText}>
          {isClocked ? 'Swipe Down' : 'Swipe Up'}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  clockButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowRadius: 16,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 8 },
  },
  clockIcon: {
    marginBottom: 8,
  },
  timeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 28,
    marginBottom: 4,
  },
  swipeText: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.8,
    marginTop: 8,
    textAlign: 'center',
  },
});
