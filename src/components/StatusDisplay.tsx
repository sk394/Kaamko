import React, { useEffect, useState, memo } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text, Card, Icon } from 'react-native-paper';
import { formatTime } from '../utils/timeUtils';
import { AppColors } from '../theme/colors';

interface StatusDisplayProps {
  isClocked: boolean;
  clockInTime: Date | null;
  isLoading?: boolean;
}

const StatusDisplayComponent: React.FC<StatusDisplayProps> = ({
  isClocked,
  clockInTime,
  isLoading = false,
}) => {
  const [fadeAnim] = useState(new Animated.Value(1));
  const [scaleAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    // Animate status change
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0.7,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [isClocked]);

  const getStatusColor = () => {
    if (isLoading) return AppColors.onSurfaceVariant;
    return isClocked ? AppColors.primary : AppColors.outline;
  };

  const getIconName = () => {
    if (isLoading) return 'clock-time-four';
    return isClocked ? 'clock-check' : 'clock-outline';
  };

  return (
    <Animated.View
      style={[{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      <Card
        style={[styles.card, isClocked && styles.clockedInCard]}
        mode="elevated">
        <Card.Content>
          <View style={styles.statusContainer}>
            <Icon source={getIconName()} size={32} color={getStatusColor()} />
            <View style={styles.textContainer}>
              <Text
                variant="headlineSmall"
                style={[styles.statusText, { color: getStatusColor() }]}>
                {isLoading
                  ? 'Processing...'
                  : isClocked
                    ? 'Clocked In'
                    : 'Not Clocked In'}
              </Text>
              {isClocked && clockInTime && !isLoading && (
                <Text variant="bodyLarge" style={styles.timeText}>
                  Since {formatTime(clockInTime.toISOString())}
                </Text>
              )}
              {isLoading && (
                <Text variant="bodyMedium" style={styles.processingText}>
                  Please wait...
                </Text>
              )}
            </View>
          </View>
        </Card.Content>
      </Card>
    </Animated.View>
  );
};

// Memoize component to prevent unnecessary re-renders
// Only re-render when props actually change
export const StatusDisplay = memo(
  StatusDisplayComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.isClocked === nextProps.isClocked &&
      prevProps.isLoading === nextProps.isLoading &&
      prevProps.clockInTime?.getTime() === nextProps.clockInTime?.getTime()
    );
  }
);

const styles = StyleSheet.create({
  card: {
    margin: 16,
    elevation: 3,
  },
  clockedInCard: {
    backgroundColor: AppColors.primaryContainer,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  textContainer: {
    marginLeft: 16,
    alignItems: 'center',
  },
  statusText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  timeText: {
    marginTop: 4,
    color: AppColors.onSurfaceVariant,
    textAlign: 'center',
  },
  processingText: {
    marginTop: 4,
    color: AppColors.onSurfaceVariant,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
