import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Animated } from 'react-native';
import {
  PaperProvider,
  Text,
  ActivityIndicator,
  Snackbar,
  MD3LightTheme,
  Button,
} from 'react-native-paper';
import { AppColors } from './src/theme/colors';
import { AnimatedClockButton } from './src/components/AnimatedClockButton';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import SessionsHistoryScreen from './src/components/SessionsHistoryScreen';
import {
  loadStoredData,
  saveCurrentState,
  batchSaveClockOutData,
} from './src/utils/storage';
import { AppState, SessionObject, NavigationMethods } from './src/types';
import { calculateHours } from './src/utils/timeUtils';
import { SessionsProvider, useSessionsContext } from './src/contexts/SessionsContext';
import AnalogClock from './src/components/AnalogClock';

/**
 * Main application content component
 * Handles all time tracking functionality including:
 * - Clock in/out operations
 * - Session history management
 * - Data persistence with AsyncStorage
 * - Error handling and user feedback
 */
function AppContent() {
  // Local state for clocked in/out and navigation only
  const [state, setState] = useState<Pick<AppState, 'isClocked' | 'clockInTime' | 'loading' | 'navigation'>>({
    isClocked: false,
    clockInTime: null,
    loading: true,
    navigation: {
      currentScreen: 'main',
    },
  });
  // Use sessions context for session management
  const { sessions, addSession, refreshSessions } = useSessionsContext();

  // Notification state for user feedback
  // Used to show success/error messages via Snackbar component
  const [notificationMessage, setNotificationMessage] = useState<string>('');
  const [showNotificationVisible, setShowNotificationVisible] = useState(false);
  const [notificationType, setNotificationType] = useState<'success' | 'error'>(
    'success'
  );

  // Screen transition animations
  // Requirement 6.3: Add smooth transitions between screens
  const [screenTransition] = useState(new Animated.Value(1));
  const [isTransitioning, setIsTransitioning] = useState(false);

  // App initialization effect
  // Runs once when component mounts to load saved data from AsyncStorage
  useEffect(() => {
    initializeApp();
  }, []);

  // Memoize notification handler to prevent unnecessary re-renders
  const showNotification = useCallback(
    (message: string, type: 'success' | 'error' = 'success') => {
      setNotificationMessage(message);
      setNotificationType(type);
      setShowNotificationVisible(true);
    },
    []
  );

  /**
   * Initialize the application by loading saved data from AsyncStorage
   * This function runs on app startup to restore previous state
   * Includes error handling to ensure app works even if storage fails
   */
  const initializeApp = async () => {
    try {
      // Add a minimum loading time to show the loading state for better UX
      // This prevents the loading screen from flashing too quickly
      const [dataResult] = await Promise.all([
        loadStoredData(),
        new Promise((resolve) => setTimeout(resolve, 800)), // Minimum 800ms loading
      ]);

      const { clockState, sessions } = dataResult;

      // Update app state with loaded data
      // Convert clockInTime from string to Date object for internal use
      setState({
        isClocked: clockState.isClocked,
        clockInTime: clockState.clockInTime
          ? new Date(clockState.clockInTime)
          : null,
        loading: false,
        navigation: {
          currentScreen: 'main',
        },
      });
      // Refresh context sessions from storage
      refreshSessions();
    } catch (error) {
      console.error('Failed to initialize app:', error);

      // Show user-friendly error message
      showNotification(
        'Failed to load saved data. Starting with fresh state.',
        'error'
      );

      // Set default state on error - app continues to function
      // This ensures the app is usable even if storage is corrupted
      setState({
        isClocked: false,
        clockInTime: null,
        loading: false,
        navigation: {
          currentScreen: 'main',
        },
      });
    }
  };

  /**
   * Handle clock-in functionality
   * Records the current timestamp and saves state to AsyncStorage
   * Includes loading states and error handling for better UX
   * Memoized to prevent unnecessary re-renders of child components
   */
  const handleClockIn = useCallback(async () => {
    try {
      const clockInTime = new Date();

      // Set loading state immediately for user feedback
      // This shows the loading spinner and disables buttons
      setState((prevState) => ({
        ...prevState,
        loading: true,
      }));

      // Add a small delay to show loading state for better UX
      // This prevents the loading state from flashing too quickly
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Save clock-in state to AsyncStorage immediately
      // This ensures data persistence even if app is closed
      await saveCurrentState({
        isClocked: true,
        clockInTime: clockInTime.toISOString(),
      });

      // Update component state when user clocks in successfully
      setState((prevState) => ({
        ...prevState,
        isClocked: true,
        clockInTime,
        loading: false,
      }));

      // Show success feedback to user
      showNotification('Successfully clocked in!', 'success');
    } catch (error) {
      console.error('Failed to clock in:', error);

      // Revert state on error to maintain consistency
      setState((prevState) => ({
        ...prevState,
        isClocked: false,
        clockInTime: null,
        loading: false,
      }));

      // Show user-friendly error message
      // App continues to work but warns about potential data loss
      showNotification(
        'Failed to save clock-in. You can continue using the app, but your time may not be saved.',
        'error'
      );
    }
  }, [showNotification]);

  /**
   * Handle clock-out functionality
   * Calculates hours worked, creates session record, and saves to AsyncStorage
   * Uses batch operations for better performance and data consistency
   * Memoized to prevent unnecessary re-renders of child components
   */
  const handleClockOut = useCallback(async () => {
    // Validate that user is currently clocked in
    if (!state.isClocked || !state.clockInTime) {
      console.error('Cannot clock out: not currently clocked in');
      return;
    }

    try {
      const clockOutTime = new Date();

      // Calculate hours worked for the session using utility function
      // This handles time differences including overnight sessions
      const hours = calculateHours(
        state.clockInTime.toISOString(),
        clockOutTime.toISOString()
      );

      // Create session object with all required data
      // ID uses timestamp for uniqueness, date in YYYY-MM-DD format
      const session: SessionObject = {
        id: `session-${Date.now()}`,
        // Save date in local time (YYYY-MM-DD)
        date:
          clockOutTime.getFullYear() + '-' +
          String(clockOutTime.getMonth() + 1).padStart(2, '0') + '-' +
          String(clockOutTime.getDate()).padStart(2, '0'),
        clockIn: state.clockInTime.toISOString(),
        clockOut: clockOutTime.toISOString(),
        hours,
      };

      // Set loading state to show user feedback
      setState((prevState) => ({
        ...prevState,
        loading: true,
      }));

      // Add a small delay to show loading state for better UX
      // Longer delay for clock-out as it involves more processing
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Use batch operation for better performance - saves both session and clock state atomically
      // This prevents data inconsistency if one operation fails
      await batchSaveClockOutData(
        { isClocked: false, clockInTime: null },
        session
      );

      // Update UI - reset clock state and add session to history
      // Session is added to beginning of array (most recent first)
      setState((prevState) => ({
        ...prevState,
        isClocked: false,
        clockInTime: null,
        loading: false,
      }));
      // Add session to context
      addSession(session);

      // Show success feedback with session details
      showNotification(
        `Successfully clocked out! Worked ${hours.toFixed(2)} hours.`,
        'success'
      );
    } catch (error) {
      console.error('Failed to clock out:', error);

      // Remove loading state on error, but keep clocked-in state
      // This allows user to try clocking out again
      setState((prevState) => ({
        ...prevState,
        loading: false,
      }));

      // Show user-friendly error message
      showNotification(
        'Failed to save work session. You can try clocking out again.',
        'error'
      );
    }
  }, [state.isClocked, state.clockInTime, showNotification]);

  /**
   * Animate screen transition
   * Requirement 6.3: Add smooth transitions between screens
   */
  const animateScreenTransition = useCallback((callback: () => void) => {
    if (isTransitioning) return; // Prevent multiple simultaneous transitions

    setIsTransitioning(true);

    Animated.sequence([
      // Fade out current screen
      Animated.timing(screenTransition, {
        toValue: 0.3,
        duration: 200,
        useNativeDriver: true,
      }),
      // Change screen (callback)
      Animated.timing(screenTransition, {
        toValue: 0.3,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Execute the navigation change
      callback();

      // Fade in new screen
      Animated.timing(screenTransition, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setIsTransitioning(false);
      });
    });
  }, [screenTransition, isTransitioning]);

  /**
   * Navigation methods for screen switching with smooth transitions
   * These methods handle transitions between main screen and sessions history
   * Memoized to prevent unnecessary re-renders of child components
   */
  const navigationMethods: NavigationMethods = {
    /**
     * Navigate to sessions history screen with smooth transition
     * Updates navigation state to show sessions history page
     */
    navigateToSessionsHistory: useCallback(() => {
      animateScreenTransition(() => {
        setState((prevState) => ({
          ...prevState,
          navigation: {
            currentScreen: 'sessionsHistory',
          },
        }));
      });
    }, [animateScreenTransition]),

    /**
     * Navigate back to main screen with smooth transition
     * Updates navigation state to show main time tracking page
     */
    navigateToMain: useCallback(() => {
      animateScreenTransition(() => {
        setState((prevState) => ({
          ...prevState,
          navigation: {
            currentScreen: 'main',
          },
        }));
      });
    }, [animateScreenTransition]),
  };

  if (state.loading) {
    return (
      <PaperProvider theme={MD3LightTheme}>
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" style={styles.loadingIndicator} />
          <Text variant="headlineMedium" style={styles.loadingText}>
            Kaamko App
          </Text>
          <Text variant="bodyMedium" style={styles.loadingSubtext}>
            Loading your data...
          </Text>
          <StatusBar style="auto" />
        </View>
      </PaperProvider>
    );
  }

  // Conditional rendering based on current screen
  // Requirement 6.4: Implement screen switching logic and state management
  const renderCurrentScreen = () => {
    switch (state.navigation.currentScreen) {
      case 'sessionsHistory':
        return (
          <SessionsHistoryScreen
            onNavigateBack={navigationMethods.navigateToMain}
          />
        );
      case 'main':
      default:
        return (
          <View style={styles.mainContainer}>
            {/* Blurred header background */}
            <View style={[styles.headerBlurWrapper, styles.centered]} pointerEvents="none">
              <Text style={styles.headerBlurText}>Kaamko App</Text>
            </View>
            {/* Navigation button at top right */}
            <View style={styles.navButtonWrapper}>
              <Text
                style={styles.navButton}
                onPress={navigationMethods.navigateToSessionsHistory}
              >
                Session History
                {' →'}
              </Text>
            </View>
            {/* Show AnalogClock and working-since text when clocked in */}
            {state.isClocked && state.clockInTime ? (
              <View style={styles.clockedInContainer}>
                <AnalogClock clockInTime={state.clockInTime} />
                <Text style={styles.workingSinceText}>
                  You have been working since {state.clockInTime ? new Date(state.clockInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                </Text>
                {/* Swipe to unlock style for clock out */}
                <View style={styles.swipeDownWrapper}>
                  <Button
                    style={styles.swipeDownIcon}
                    onPress={handleClockOut}
                  >
                    <Text style={styles.swipeDownText}>
                      Clock Out
                    </Text>
                  </Button>
                </View>
              </View>
            ) : (
              <AnimatedClockButton
                isClocked={state.isClocked}
                onClockIn={handleClockIn}
                onClockOut={handleClockOut}
                disabled={state.loading}
              />
            )}
          </View>
        );
    }
  }

  return (
    <PaperProvider theme={MD3LightTheme}>
      <View style={styles.container}>
        <StatusBar style="auto" />

        {/* Animated container for smooth screen transitions */}
        <Animated.View
          style={[
            styles.screenContainer,
            {
              opacity: screenTransition,
              transform: [
                {
                  scale: screenTransition.interpolate({
                    inputRange: [0.3, 1],
                    outputRange: [0.95, 1],
                    extrapolate: 'clamp',
                  }),
                },
              ],
            },
          ]}
        >
          {/* Render current screen based on navigation state */}
          {renderCurrentScreen()}
        </Animated.View>

        <Snackbar
          visible={showNotificationVisible}
          onDismiss={() => setShowNotificationVisible(false)}
          duration={notificationType === 'error' ? 6000 : 3000}
          style={[
            styles.snackbar,
            notificationType === 'error' && styles.errorSnackbar,
            notificationType === 'success' && styles.successSnackbar,
          ]}
          action={{
            label: 'Dismiss',
            onPress: () => setShowNotificationVisible(false),
          }}>
          {notificationMessage}
        </Snackbar>
      </View>
    </PaperProvider>
  );
}

/**
 * Main App component with error boundary
 * Wraps the main application content in an error boundary to catch
 * and handle any unhandled errors gracefully
 */
export default function App() {
  return (
    <ErrorBoundary>
      <SessionsProvider>
        <AppContent />
      </SessionsProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a"
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenContainer: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
  },
  headerBlurWrapper: {
    position: 'absolute',
    top: 50,
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: -1,
  },
  headerBlurText: {
    fontSize: 56,
    fontWeight: 'bold',
    color: AppColors.primary,
    opacity: 0.15,
    letterSpacing: 2,
    textAlign: 'center',
  },
  navButtonWrapper: {
    position: 'absolute',
    top: 40,
    right: 24,
    zIndex: 2,
  },
  navButton: {
    backgroundColor: '#6366f1',
    color: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    fontWeight: '600',
    fontSize: 14,
    elevation: 6,
    overflow: 'hidden',
    minWidth: 140,
    textAlign: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  clockedInContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    marginBottom: 80,
  },
  workingSinceText: {
    marginTop: 24,
    fontSize: 18,
    color: AppColors.primary,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  swipeDownWrapper: {
    marginTop: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  swipeDownText: {
    fontSize: 20,
    color: AppColors.surface,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  swipeDownIcon: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    backgroundColor: '#ef4444',
    overflow: 'hidden',
    elevation: 8,
    minWidth: 180,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  loadingIndicator: {
    marginBottom: 16,
  },
  loadingText: {
    color: AppColors.primary,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  loadingSubtext: {
    color: AppColors.onSurfaceVariant,
    textAlign: 'center',
  },
  snackbar: {
    marginBottom: 16,
    marginHorizontal: 16,
    borderRadius: 8,
  },
  errorSnackbar: {
    backgroundColor: AppColors.errorContainer,
  },
  successSnackbar: {
    backgroundColor: "#34d399",
  },
});
