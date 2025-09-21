import React, { useState, useCallback, memo } from 'react';
import { View, StyleSheet, Pressable, Animated } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { AppColors } from '../theme/colors';
import { FilterType } from '../types';

/**
 * Props interface for FilterControls component
 * Defines the required props for the filter controls
 */
interface FilterControlsProps {
  /** Currently active filter type */
  activeFilter: FilterType;

  /** Callback function when filter selection changes */
  onFilterChange: (filter: FilterType) => void;
}

/**
 * Filter option configuration
 * Defines available filter options with their labels
 */
interface FilterOption {
  type: FilterType;
  label: string;
}

/**
 * Available filter options
 * Requirement 5.2: Display "Last Week" and "Last Month" options as specified
 */
const FILTER_OPTIONS: FilterOption[] = [
  { type: 'all', label: 'All' },
  { type: 'thisWeek', label: 'This Week' },
  { type: 'lastWeek', label: 'Last Week' },
  { type: 'lastMonth', label: 'Last Month' },
];

/**
 * FilterControls component
 * 
 * Provides filter buttons for sessions history page with proper positioning,
 * visual feedback, and accessibility support.
 * 
 * Requirements addressed:
 * - 5.1: Display filter buttons in the top right area of the screen
 * - 5.2: Show "Last Week" and "Last Month" options as specified
 * - 5.3: Provide immediate visual feedback (button press animation)
 * - 5.4: Ensure easily tappable with appropriate touch targets
 * - 5.5: Ensure filter buttons remain accessible on small screens
 */
const FilterControls: React.FC<FilterControlsProps> = ({
  activeFilter,
  onFilterChange,
}) => {
  const [pressedButton, setPressedButton] = useState<FilterType | null>(null);
  // Dynamically create animation values for all filter types
  const [buttonAnimations] = useState(() => {
    const anims: Record<string, Animated.Value> = {};
    FILTER_OPTIONS.forEach(opt => {
      anims[opt.type] = new Animated.Value(1);
    });
    return anims;
  });

  /**
   * Handle filter button press with enhanced visual feedback
   * Requirement 5.3: Provide immediate visual feedback (button press animation)
   */
  const handleFilterPress = useCallback((filterType: FilterType) => {
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
  }, [onFilterChange, buttonAnimations]);

  return (
    <View style={styles.container}>
      <Surface style={styles.filterSurface} elevation={2}>
        {/* Wrap buttons in a View to avoid overflow: hidden on Surface */}
        <View style={styles.buttonContainerWrapper}>
          <View style={styles.buttonContainer}>
            {FILTER_OPTIONS.map((option) => {
              const isActive = activeFilter === option.type && activeFilter !== 'all';
              const isPressed = pressedButton === option.type;
              return (
                <Animated.View
                  key={option.type}
                  style={{
                    transform: [{ scale: buttonAnimations[option.type] }],
                  }}
                >
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
                    accessibilityHint={`Shows sessions from ${option.label.toLowerCase()}`}
                  >
                    <Text
                      variant="labelMedium"
                      style={[
                        styles.filterButtonText,
                        isActive && styles.activeFilterButtonText,
                      ]}
                    >
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
    // Requirement 5.1: Position in top right area
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  filterSurface: {
    borderRadius: 24,
    backgroundColor: AppColors.surface,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: AppColors.outline,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 4,
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
    backgroundColor: 'transparent',
    // Enhanced visual feedback preparation
    transform: [{ scale: 1 }],
  },
  activeFilterButton: {
    // Requirement 5.2: Highlight active filter button with enhanced styling
    backgroundColor: AppColors.primaryContainer,
    elevation: 2,
    shadowColor: AppColors.primary,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  pressedFilterButton: {
    // Requirement 5.3: Enhanced immediate visual feedback
    opacity: 0.7,
  },
  filterButtonText: {
    color: AppColors.onSurfaceVariant,
    fontWeight: '500',
    textAlign: 'center',
    // Requirement 5.5: Ensure text remains readable on small screens
    fontSize: 12,
  },
  activeFilterButtonText: {
    color: AppColors.primary,
    fontWeight: '600',
  },
});