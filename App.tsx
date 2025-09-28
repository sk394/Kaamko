import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  View,
  Animated,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
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
import SettingsPage from './src/components/SettingsPage';
import { SessionDialog } from './src/components';
import {
  loadStoredData,
  saveCurrentState,
  batchSaveClockOutData,
  saveSession,
} from './src/utils/storage';
import { AppState, SessionObject} from './src/types';
import { calculateHours } from './src/utils/timeUtils';
import {
  SessionsProvider,
  useSessionsContext,
} from './src/contexts/SessionsContext';
import AnalogClock from './src/components/AnalogClock';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

const MAIN_TABS = [
  { id: 'home', icon: 'home-outline', activeIcon: 'home', label: 'Home' },
  { id: 'history', icon: 'time-outline', activeIcon: 'time', label: 'History' },
  {
    id: 'settings',
    icon: 'settings-outline',
    activeIcon: 'settings',
    label: 'Settings',
  },
];

const ADD_TAB = {
  id: 'add',
  icon: 'add-circle-outline',
  activeIcon: 'add-circle',
  label: 'Clock',
};

const MAIN_TAB_WIDTH = ((width - 32) * 0.6) / MAIN_TABS.length; // 60% of total width for main tabs
const ADD_BUTTON_SIZE = 60; // Size of the circular add button

interface TabButtonProps {
  tab: (typeof MAIN_TABS)[0];
  index: number;
  activeTab: string;
  onTabPress: (tabId: string) => void;
}

const TabButton: React.FC<TabButtonProps> = React.memo(
  ({ tab, index, activeTab, onTabPress }) => {
    const isActive = tab.id === activeTab;
    const [isPressed, setIsPressed] = useState(false);

    const handlePress = useCallback(() => {
      setIsPressed(true);
      setTimeout(() => setIsPressed(false), 150);
      onTabPress(tab.id);
    }, [onTabPress, tab.id]);

    return (
      <TouchableOpacity
        onPress={handlePress}
        style={[
          styles.tab,
          {
            opacity: isActive ? 1 : 0.6,
            transform: [{ scale: isPressed ? 0.95 : isActive ? 1.1 : 1 }],
          },
        ]}>
        <Ionicons
          name={isActive ? tab.activeIcon : (tab.icon as any)}
          size={24}
          color={isActive ? '#FFFFFF' : 'rgba(255,255,255,0.6)'}
        />
      </TouchableOpacity>
    );
  }
);

TabButton.displayName = 'TabButton';

interface BottomTabProps {
  activeTab: string;
  onTabPress: (tabId: string) => void;
}

const BottomTab: React.FC<BottomTabProps> = ({
  activeTab = 'main',
  onTabPress,
}) => {
  const getIndicatorPosition = () => {
    const activeIndex = MAIN_TABS.findIndex((tab) => tab.id === activeTab);
    return activeIndex !== -1 ? activeIndex * MAIN_TAB_WIDTH : 0;
  };

  const handleAddPress = useCallback(() => {
    onTabPress(ADD_TAB.id);
  }, [onTabPress]);

  return (
    <View style={styles.bottomContainer}>
      {/* Main tabs container on the left */}
      <View style={styles.mainTabsWrapper}>
        <BlurView style={styles.absolute} tint="dark" intensity={20} />
        <View style={styles.mainTabsContainer}>
          <View
            style={[
              styles.indicator,
              {
                transform: [{ translateX: getIndicatorPosition() }],
              },
            ]}
          />
          {MAIN_TABS.map((tab, index) => (
            <TabButton
              key={tab.id}
              tab={tab}
              index={index}
              activeTab={activeTab}
              onTabPress={onTabPress}
            />
          ))}
        </View>
      </View>

      {/* Separate circular add button on the right */}
      <TouchableOpacity
        onPress={handleAddPress}
        style={[
          styles.addButton,
          {
            backgroundColor:
              activeTab === ADD_TAB.id
                ? 'rgba(255,255,255,0.25)'
                : 'rgba(255,255,255,0.15)',
          },
        ]}>
        <BlurView style={styles.addButtonBlur} tint="dark" intensity={20} />
        <Ionicons
          name={
            activeTab === ADD_TAB.id
              ? ADD_TAB.activeIcon
              : (ADD_TAB.icon as any)
          }
          size={28}
          color={activeTab === ADD_TAB.id ? '#FFFFFF' : 'rgba(255,255,255,0.7)'}
        />
      </TouchableOpacity>
    </View>
  );
};

function AppContent() {
  // Local state for clocked in/out and navigation only
  const [state, setState] = useState<
    Pick<AppState, 'isClocked' | 'clockInTime' | 'loading' | 'navigation'>
  >({
    isClocked: false,
    clockInTime: null,
    loading: true,
    navigation: {
      currentScreen: 'main',
    },
  });

  // Bottom tab navigation state
  const [activeTab, setActiveTab] = useState<string>('home');

  // Manual session dialog state
  const [showSessionDialog, setShowSessionDialog] = useState(false);

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

  const initializeApp = async () => {
    try {
      const [dataResult] = await Promise.all([
        loadStoredData(),
        new Promise((resolve) => setTimeout(resolve, 800)), // Minimum 800ms loading
      ]);

      const { clockState, sessions } = dataResult;

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
      const hours = calculateHours(
        state.clockInTime.toISOString(),
        clockOutTime.toISOString()
      );

      // Create session object with all required data
      const session: SessionObject = {
        id: `session-${Date.now()}`,
        // Save date in local time (YYYY-MM-DD)
        date:
          clockOutTime.getFullYear() +
          '-' +
          String(clockOutTime.getMonth() + 1).padStart(2, '0') +
          '-' +
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

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Use batch operation for better performance - saves both session and clock state atomically
      await batchSaveClockOutData(
        { isClocked: false, clockInTime: null },
        session
      );

      // Update UI - reset clock state and add session to history
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

  const animateScreenTransition = useCallback(
    (callback: () => void) => {
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
    },
    [screenTransition, isTransitioning]
  );

  const handleTabPress = useCallback(
    (tabId: string) => {
      setActiveTab(tabId);

      // Map tab IDs to screen navigation
      switch (tabId) {
        case 'home':
        case 'clock':
          animateScreenTransition(() => {
            setState((prevState) => ({
              ...prevState,
              navigation: {
                currentScreen: 'main',
              },
            }));
          });
          break;
        case 'history':
          animateScreenTransition(() => {
            setState((prevState) => ({
              ...prevState,
              navigation: {
                currentScreen: 'sessionsHistory',
              },
            }));
          });
          break;
        case 'add':
          // Show manual session dialog
          setShowSessionDialog(true);
          break;
        case 'settings':
          animateScreenTransition(() => {
            setState((prevState) => ({
              ...prevState,
              navigation: {
                currentScreen: 'settings',
              },
            }));
          });
          break;
        default:
          break;
      }
    },
    [animateScreenTransition, showNotification]
  );

  const handleManualSessionAdd = useCallback(
    async (session: SessionObject) => {
      try {
        // Save session to persistent storage first
        await saveSession(session);
        
        // Add session to context (for immediate UI update)
        addSession(session);

        // Show success notification
        showNotification(
          `Manual session added! Worked ${session.hours.toFixed(2)} hours.`,
          'success'
        );
      } catch (error) {
        console.error('Failed to add manual session:', error);
        showNotification(
          'Failed to save manual session. Please try again.',
          'error'
        );
      }
    },
    [addSession, showNotification]
  );

  const handleSessionDialogDismiss = useCallback(() => {
    setShowSessionDialog(false);
  }, []);

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
        return <SessionsHistoryScreen />;
      case 'settings':
        return <SettingsPage />;
      case 'main':
      default:
        return (
          <View style={styles.mainContainer}>
            <View
              style={[styles.headerBlurWrapper, styles.centered]}
              pointerEvents="none">
              <Text style={styles.headerBlurText}>Kaamko App</Text>
              <Text style={styles.headerSloganText}>
                Work Smarter, Track Better
              </Text>
            </View>

            {/* Show AnalogClock and working-since text when clocked in */}
            {state.isClocked && state.clockInTime ? (
              <View style={styles.clockedInContainer}>
                <AnalogClock clockInTime={state.clockInTime} />
                <Text style={styles.workingSinceText}>
                  You have been working since{' '}
                  {state.clockInTime
                    ? new Date(state.clockInTime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                </Text>
                <View style={styles.swipeDownWrapper}>
                  <Button style={styles.swipeDownIcon} onPress={handleClockOut}>
                    <Text style={styles.swipeDownText}>Clock Out</Text>
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
  };

  return (
    <PaperProvider theme={MD3LightTheme}>
      <View style={styles.container}>
        <StatusBar style="auto" />
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
          ]}>
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

        {/* Manual Session Dialog */}
        <SessionDialog
          visible={showSessionDialog}
          onDismiss={handleSessionDialogDismiss}
          onAddSession={handleManualSessionAdd}
        />

        {/* Bottom Tab Navigation */}
        <BottomTab activeTab={activeTab} onTabPress={handleTabPress} />
      </View>
    </PaperProvider>
  );
}

/**
 * Main App component with error boundary
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
    backgroundColor: '#0f172a',
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
    paddingBottom: 100, // Add space for bottom tab
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
  headerSloganText: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.primary,
    opacity: 0.25,
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 8,
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
    marginBottom: 100, // Position above bottom tab (reduced since tabs are smaller)
    marginHorizontal: 16,
    borderRadius: 8,
  },
  errorSnackbar: {
    backgroundColor: AppColors.errorContainer,
  },
  successSnackbar: {
    backgroundColor: '#34d399',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 24,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mainTabsWrapper: {
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    width: (width - 32) * 0.6, // 60% of available width
  },
  absolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  mainTabsContainer: {
    flexDirection: 'row',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  indicator: {
    position: 'absolute',
    width: MAIN_TAB_WIDTH - 12,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    left: 6,
    top: 10, // Center vertically (60-40)/2 = 10
    shadowColor: '#fff',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  addButton: {
    width: ADD_BUTTON_SIZE,
    height: ADD_BUTTON_SIZE,
    borderRadius: ADD_BUTTON_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  addButtonBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  icon: {
    // Remove invalid text properties for icon
  },
});
