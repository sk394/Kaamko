import React, { useState, memo, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { AppColors } from '../theme/colors';

interface ClockControlsProps {
  isClocked: boolean;
  onClockIn: () => void;
  onClockOut: () => void;
  disabled: boolean;
}

const ClockControlsComponent: React.FC<ClockControlsProps> = ({
  isClocked,
  onClockIn,
  onClockOut,
  disabled,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [buttonPressed, setButtonPressed] = useState<'in' | 'out' | null>(null);

  // Memoize handlers to prevent unnecessary re-renders of child components
  const handleClockIn = useCallback(() => {
    setIsPressed(true);
    setButtonPressed('in');
    onClockIn();
    // Reset pressed state after a short delay for visual feedback
    const timeoutId = setTimeout(() => {
      setIsPressed(false);
      setButtonPressed(null);
    }, 200);

    // Store timeout ID for potential cleanup (though component lifecycle handles this)
    return () => clearTimeout(timeoutId);
  }, [onClockIn]);

  const handleClockOut = useCallback(() => {
    setIsPressed(true);
    setButtonPressed('out');
    onClockOut();
    // Reset pressed state after a short delay for visual feedback
    const timeoutId = setTimeout(() => {
      setIsPressed(false);
      setButtonPressed(null);
    }, 200);

    // Store timeout ID for potential cleanup (though component lifecycle handles this)
    return () => clearTimeout(timeoutId);
  }, [onClockOut]);

  return (
    <View style={styles.container}>
      {disabled && (
        <Text variant="bodyMedium" style={styles.loadingText}>
          {buttonPressed === 'in'
            ? 'Saving clock-in time...'
            : buttonPressed === 'out'
              ? 'Calculating hours and saving session...'
              : 'Processing...'}
        </Text>
      )}

      {!isClocked ? (
        <Button
          mode="contained"
          onPress={handleClockIn}
          disabled={disabled}
          style={[
            styles.button,
            styles.clockInButton,
            (isPressed || disabled) && styles.pressedButton,
          ]}
          contentStyle={styles.buttonContent}
          icon={disabled ? undefined : 'play'}
          loading={disabled}>
          {disabled ? 'Clocking In...' : 'Clock In'}
        </Button>
      ) : (
        <Button
          mode="contained"
          onPress={handleClockOut}
          disabled={disabled}
          style={[
            styles.button,
            styles.clockOutButton,
            (isPressed || disabled) && styles.pressedButton,
          ]}
          contentStyle={styles.buttonContent}
          icon={disabled ? undefined : 'stop'}
          loading={disabled}
          buttonColor={AppColors.error}>
          {disabled ? 'Clocking Out...' : 'Clock Out'}
        </Button>
      )}
    </View>
  );
};

// Memoize component to prevent unnecessary re-renders
// Only re-render when props actually change
export const ClockControls = memo(
  ClockControlsComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.isClocked === nextProps.isClocked &&
      prevProps.disabled === nextProps.disabled &&
      prevProps.onClockIn === nextProps.onClockIn &&
      prevProps.onClockOut === nextProps.onClockOut
    );
  }
);

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  button: {
    minWidth: 200,
    elevation: 3,
  },
  buttonContent: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  clockInButton: {
    backgroundColor: AppColors.primary,
  },
  clockOutButton: {
    // buttonColor prop handles the color
  },
  pressedButton: {
    elevation: 1,
    transform: [{ scale: 0.98 }],
  },
  loadingText: {
    marginBottom: 8,
    color: AppColors.onSurfaceVariant,
    fontStyle: 'italic',
  },
});
