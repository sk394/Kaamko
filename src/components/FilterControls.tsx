import React, { useState, useCallback, memo } from 'react';
import { View, StyleSheet, Pressable, Animated } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { AppColors } from '../theme/colors';
import { FilterType } from '../types';

interface FilterControlsProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

interface FilterOption {
  type: FilterType;
  label: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  { type: 'all', label: 'All' },
  { type: 'thisWeek', label: 'This Week' },
  { type: 'lastWeek', label: 'Last Week' },
  { type: 'lastMonth', label: 'Last Month' },
];

const FilterControls: React.FC<FilterControlsProps> = ({
  activeFilter,
  onFilterChange,
}) => {
  const [pressedButton, setPressedButton] = useState<FilterType | null>(null);
  // Dynamically create animation values for all filter types
  const [buttonAnimations] = useState(() => {
    const anims: Record<string, Animated.Value> = {};
    FILTER_OPTIONS.forEach((opt) => {
      anims[opt.type] = new Animated.Value(1);
    });
    return anims;
  });

  const handleFilterPress = useCallback(
    (filterType: FilterType) => {
      setPressedButton(filterType);

      // Enhanced button press animation
      const animation = buttonAnimations[filterType];
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 0.92,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      onFilterChange(filterType);

      // Reset pressed state after animation completes
      const timeoutId = setTimeout(() => {
        setPressedButton(null);
      }, 250);

      return () => clearTimeout(timeoutId);
    },
    [onFilterChange, buttonAnimations]
  );

  return (
    <View style={styles.container}>
      <Surface style={styles.filterSurface} elevation={2}>
        <View style={styles.buttonContainerWrapper}>
          <View style={styles.buttonContainer}>
            {FILTER_OPTIONS.map((option) => {
              const isActive =
                activeFilter === option.type && activeFilter !== 'all';
              const isPressed = pressedButton === option.type;
              return (
                <Animated.View
                  key={option.type}
                  style={{
                    transform: [{ scale: buttonAnimations[option.type] }],
                  }}>
                  <Pressable
                    onPress={() => handleFilterPress(option.type)}
                    style={({ pressed }) => [
                      styles.filterButton,
                      isActive && styles.activeFilterButton,
                      (pressed || isPressed) && styles.pressedFilterButton,
                    ]}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel={`Filter by ${option.label}`}
                    accessibilityState={{ selected: isActive }}
                    accessibilityHint={`Shows sessions from ${option.label.toLowerCase()}`}>
                    <Text
                      variant="labelMedium"
                      style={[
                        styles.filterButtonText,
                        isActive && styles.activeFilterButtonText,
                      ]}>
                      {option.label}
                    </Text>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        </View>
      </Surface>
    </View>
  );
};

// Memoize FilterControls to prevent unnecessary re-renders
// Only re-render when activeFilter or onFilterChange changes
export default memo(FilterControls, (prevProps, nextProps) => {
  return (
    prevProps.activeFilter === nextProps.activeFilter &&
    prevProps.onFilterChange === nextProps.onFilterChange
  );
});

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  filterSurface: {
    borderRadius: 24,
    backgroundColor: 'rgba(255, 251, 254, 0.85)', // Semi-transparent blur-like effect
    overflow: 'hidden',
    elevation: 3,
    shadowColor: AppColors.outline,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(121, 116, 126, 0.2)', // Subtle border for blur effect
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)', // Additional transparency layer
  },
  buttonContainerWrapper: {
    overflow: 'hidden',
    borderRadius: 24,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    transform: [{ scale: 1 }],
  },
  activeFilterButton: {
    backgroundColor: 'rgba(234, 221, 255, 0.9)', // Semi-transparent primary container
    elevation: 2,
    shadowColor: AppColors.primary,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(103, 80, 164, 0.3)',
  },
  pressedFilterButton: {
    opacity: 0.6,
  },
  filterButtonText: {
    color: AppColors.onSurfaceVariant,
    fontWeight: '500',
    textAlign: 'center',
    fontSize: 12,
  },
  activeFilterButtonText: {
    color: AppColors.primary,
    fontWeight: '700',
  },
});
