import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  FlatList,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import {
  Text,
  Surface,
  Icon,
  IconButton,
  ActivityIndicator,
  Card,
  Divider,
} from 'react-native-paper';
import { AppColors } from '../theme/colors';
import { FilterType, SessionObject } from '../types';
import FilterControls from './FilterControls';
import {
  getLastWeekDateRange,
  getLastMonthDateRange,
  isDateInRange,
  formatDate,
  formatTime,
  getThisWeekDateRange,
} from '../utils/timeUtils';
import { useSessionsContext } from '../contexts/SessionsContext';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';

const getFilterDisplayName = (filter: FilterType): string => {
  switch (filter) {
    case 'thisWeek':
      return 'This Week';
    case 'lastWeek':
      return 'Last Week';
    case 'lastMonth':
      return 'Last Month';
    case 'all':
    default:
      return 'All Sessions';
  }
};

const getEmptyStateMessage = (filter: FilterType, hasAnySessions: boolean) => {
  if (!hasAnySessions) {
    return {
      title: 'No work sessions yet',
      subtitle: 'Your completed work sessions will appear here',
      icon: 'clock-outline' as const,
    };
  }
  switch (filter) {
    case 'thisWeek':
      return {
        title: 'No sessions found for This Week',
        subtitle: 'Try selecting a different time period or check back later',
        icon: 'calendar-week' as const,
      };
    case 'lastWeek':
      return {
        title: 'No sessions found for Last Week',
        subtitle: 'Try selecting a different time period or check back later',
        icon: 'calendar-week' as const,
      };
    case 'lastMonth':
      return {
        title: 'No sessions found for Last Month',
        subtitle: 'Try selecting a different time period or check back later',
        icon: 'calendar-month' as const,
      };
    case 'all':
    default:
      return {
        title: 'No sessions to display',
        subtitle: 'Your work sessions will appear here',
        icon: 'clock-outline' as const,
      };
  }
};

// Swipeable Session Item Component
interface SwipeableSessionItemProps {
  item: SessionObject;
  onDelete: (sessionId: string) => void;
}

const SwipeableSessionItem: React.FC<SwipeableSessionItemProps> = ({
  item,
  onDelete,
}) => {
  const translateX = useSharedValue(0);
  const deleteButtonOpacity = useSharedValue(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = useCallback(() => {
    setIsDeleting(true);
    onDelete(item.id);
  }, [item.id, onDelete]);

  const confirmDelete = useCallback(() => {
    Alert.alert(
      'Delete Session',
      `Are you sure you want to delete this session from ${formatDate(item.date)}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            translateX.value = withSpring(0);
            deleteButtonOpacity.value = withSpring(0);
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: handleDelete,
        },
      ]
    );
  }, [item.date, handleDelete, translateX, deleteButtonOpacity]);

  const panGesture = useMemo(() => {
    const SWIPE_THRESHOLD = -80;
    const DELETE_THRESHOLD = -120;

    return Gesture.Pan()
      .onUpdate((event) => {
        // Only allow left swipe (negative translation)
        if (event.translationX <= 0) {
          translateX.value = Math.max(event.translationX, DELETE_THRESHOLD);

          // Fade in delete button as user swipes
          const progress = Math.min(
            Math.abs(event.translationX) / Math.abs(SWIPE_THRESHOLD),
            1
          );
          deleteButtonOpacity.value = progress;
        }
      })
      .onEnd((event) => {
        const shouldReveal = event.translationX < SWIPE_THRESHOLD;

        if (shouldReveal) {
          translateX.value = withSpring(SWIPE_THRESHOLD);
          deleteButtonOpacity.value = withSpring(1);
        } else {
          translateX.value = withSpring(0);
          deleteButtonOpacity.value = withSpring(0);
        }
      });
  }, [translateX, deleteButtonOpacity]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const deleteButtonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: deleteButtonOpacity.value,
    transform: [
      {
        scale: interpolate(deleteButtonOpacity.value, [0, 1], [0.8, 1]),
      },
    ],
  }));

  if (isDeleting) {
    return (
      <Card style={[styles.sessionCard, styles.deletingCard]} mode="elevated">
        <Card.Content style={styles.deletingContent}>
          <ActivityIndicator size="small" color={AppColors.error} />
          <Text variant="bodyMedium" style={styles.deletingText}>
            Deleting session...
          </Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <View style={styles.swipeableContainer}>
      {/* Delete Action Background */}
      <Reanimated.View
        style={[styles.deleteBackground, deleteButtonAnimatedStyle]}>
        <IconButton
          icon="delete"
          size={24}
          iconColor="#FFFFFF"
          onPress={confirmDelete}
          style={styles.deleteButton}
        />
        <Text variant="bodySmall" style={styles.deleteText}>
          Delete
        </Text>
      </Reanimated.View>

      {/* Session Card */}
      <GestureDetector gesture={panGesture}>
        <Reanimated.View style={[cardAnimatedStyle]}>
          <Card style={styles.sessionCard} mode="elevated">
            <Card.Content>
              <View style={styles.sessionHeader}>
                <View style={styles.dateContainer}>
                  <Icon source="calendar" size={20} color={AppColors.primary} />
                  <Text variant="titleMedium" style={styles.dateText}>
                    {formatDate(item.date)}
                  </Text>
                </View>
                <Surface style={styles.hoursChip} elevation={1}>
                  <Text variant="titleMedium" style={styles.hoursText}>
                    {item.hours.toFixed(2)} hrs
                  </Text>
                </Surface>
              </View>
              <Divider style={styles.itemDivider} />
              <View style={styles.timeRow}>
                <View style={styles.timeItem}>
                  <Icon source="login" size={16} color={AppColors.primary} />
                  <Text variant="bodyMedium" style={styles.timeLabel}>
                    In:
                  </Text>
                  <Text variant="bodyMedium" style={styles.timeValue}>
                    {formatTime(item.clockIn)}
                  </Text>
                </View>
                <View style={styles.timeItem}>
                  <Icon source="logout" size={16} color={AppColors.error} />
                  <Text variant="bodyMedium" style={styles.timeLabel}>
                    Out:
                  </Text>
                  <Text variant="bodyMedium" style={styles.timeValue}>
                    {formatTime(item.clockOut)}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </Reanimated.View>
      </GestureDetector>
    </View>
  );
};

const SessionsHistoryScreen: React.FC = () => {
  const { sessions, loading, refreshSessions, deleteSession } =
    useSessionsContext();

  // State management
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [contentAnimation] = useState(new Animated.Value(0));
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Event handlers
  const handleDeleteSession = useCallback(
    async (sessionId: string) => {
      try {
        await deleteSession(sessionId);
      } catch (error) {
        Alert.alert('Error', 'Failed to delete session. Please try again.', [
          { text: 'OK' },
        ]);
      }
    },
    [deleteSession]
  );

  const toggleFullScreen = useCallback(() => {
    setIsFullScreen(!isFullScreen);
  }, [isFullScreen]);

  const handleFilterChange = useCallback((filter: FilterType) => {
    setActiveFilter(filter);
  }, []);

  // Effects
  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });
    return () => subscription?.remove();
  }, []);

  React.useEffect(() => {
    Animated.timing(contentAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [contentAnimation]);

  // Computed values
  const dateRanges = useMemo(
    () => ({
      lastWeek: getLastWeekDateRange(),
      lastMonth: getLastMonthDateRange(),
      thisWeek: getThisWeekDateRange(),
    }),
    []
  );

  const filteredSessions = useMemo(() => {
    if (activeFilter === 'all') {
      return [...sessions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    }
    let dateRange: { startDate: Date; endDate: Date } | undefined;
    if (activeFilter === 'lastWeek') {
      dateRange = dateRanges.lastWeek;
    } else if (activeFilter === 'lastMonth') {
      dateRange = dateRanges.lastMonth;
    } else if (activeFilter === 'thisWeek') {
      dateRange = dateRanges.thisWeek;
    }
    if (!dateRange) return [];
    const { startDate, endDate } = dateRange;
    return sessions
      .filter((session) => isDateInRange(session.date, startDate, endDate))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sessions, activeFilter, dateRanges]);

  const isSmallScreen = screenData.width < 400;
  const isTablet = screenData.width >= 768;

  // Memoize render function to prevent recreation on every render
  const renderSessionItem = useCallback(
    ({ item }: { item: SessionObject }) => (
      <SwipeableSessionItem item={item} onDelete={handleDeleteSession} />
    ),
    [handleDeleteSession]
  );
  // Memoize key extractor for FlatList performance
  const keyExtractor = useCallback((item: SessionObject) => item.id, []);
  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: contentAnimation,
          transform: [
            {
              translateY: contentAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
                extrapolate: 'clamp',
              }),
            },
          ],
        },
      ]}>
      {/* Header section - responsive design */}
      <Surface
        style={[styles.headerSurface, isTablet && styles.headerSurfaceTablet]}
        elevation={1}>
        <View
          style={[
            styles.headerContent,
            isSmallScreen && styles.headerContentSmall,
            isTablet && styles.headerContentTablet,
          ]}>
          <View style={styles.titleContainer}>
            <Text
              variant={isSmallScreen ? 'headlineSmall' : 'headlineMedium'}
              style={{
                color: AppColors.primary,
                fontWeight: 'bold',
                marginTop: 6,
              }}>
              Kaamko App
            </Text>
          </View>
        </View>
      </Surface>

      <View
        style={[
          styles.contentContainer,
          isSmallScreen && styles.contentContainerSmall,
          isTablet && styles.contentContainerTablet,
        ]}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginLeft: 10,
          }}>
          <View
            style={[
              styles.filterControlsContainer,
              isSmallScreen && styles.filterControlsContainerSmall,
            ]}>
            <FilterControls
              activeFilter={activeFilter}
              onFilterChange={handleFilterChange}
            />
          </View>
        </View>

        {/* Sessions display areat */}
        <View
          style={[
            styles.sessionsContainer,
            isTablet && styles.sessionsContainerTablet,
          ]}>
          {loading ? (
            <Surface style={styles.loadingContainer} elevation={1}>
              <ActivityIndicator size="large" color={AppColors.primary} />
              <Text variant="headlineSmall" style={styles.loadingTitle}>
                Loading sessions...
              </Text>
              <Text variant="bodyMedium" style={styles.loadingSubtext}>
                Please wait while we fetch your work sessions
              </Text>
            </Surface>
          ) : filteredSessions.length === 0 ? (
            (() => {
              const emptyState = getEmptyStateMessage(
                activeFilter,
                sessions.length > 0
              );
              return (
                <Surface style={styles.emptyStateContainer} elevation={1}>
                  <Icon
                    source={emptyState.icon}
                    size={64}
                    color={AppColors.outline}
                  />
                  <Text variant="headlineSmall" style={styles.emptyStateTitle}>
                    {emptyState.title}
                  </Text>
                  <Text variant="bodyMedium" style={styles.emptyStateSubtext}>
                    {emptyState.subtitle}
                  </Text>
                </Surface>
              );
            })()
          ) : (
            <View style={styles.sessionsListWrapper}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 8,
                }}>
                <Text variant="bodyMedium" style={styles.placeholderText}>
                  Showing {filteredSessions.length} of {sessions.length} session
                  {sessions.length !== 1 ? 's' : ''}
                  {activeFilter !== 'all' &&
                    ` (${getFilterDisplayName(activeFilter)})`}
                </Text>
                <IconButton
                  icon="fullscreen"
                  size={24}
                  iconColor={AppColors.primary}
                  onPress={toggleFullScreen}
                  style={styles.fullScreenButton}
                />
              </View>
              <Text variant="bodySmall" style={styles.placeholderSubtext}>
                Total Hours:{' '}
                {filteredSessions
                  .reduce((total, session) => total + session.hours, 0)
                  .toFixed(2)}
              </Text>

              <GestureHandlerRootView style={{ flex: 1 }}>
                <FlatList
                  data={filteredSessions}
                  renderItem={renderSessionItem}
                  keyExtractor={keyExtractor}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listContainer}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={10}
                  windowSize={10}
                  initialNumToRender={5}
                  getItemLayout={(data, index) => ({
                    length: 120,
                    offset: 120 * index,
                    index,
                  })}
                />
              </GestureHandlerRootView>
            </View>
          )}
        </View>
      </View>

      {/* Full Screen Modal */}
      <Modal
        visible={isFullScreen}
        animationType="slide"
        onRequestClose={toggleFullScreen}
        statusBarTranslucent={true}>
        <View style={styles.fullScreenContainer}>
          <Surface style={styles.totalHoursContainer} elevation={1}>
            <Icon source="clock" size={24} color={AppColors.primary} />
            <View style={styles.totalHoursTextContainer}>
              <Text variant="titleMedium" style={styles.totalHoursLabel}>
                Total Hours
              </Text>
              <Text variant="headlineMedium" style={styles.totalHoursValue}>
                {filteredSessions
                  .reduce((total, session) => total + session.hours, 0)
                  .toFixed(2)}{' '}
                hrs
              </Text>
            </View>
            <Text variant="bodySmall" style={styles.sessionCount}>
              {filteredSessions.length} session
              {filteredSessions.length !== 1 ? 's' : ''}
            </Text>
            <IconButton
              icon="close"
              size={24}
              iconColor={AppColors.primary}
              onPress={toggleFullScreen}
              style={styles.closeButton}
            />
          </Surface>
          <View style={styles.fullScreenContent}>
            {filteredSessions.length === 0 ? (
              (() => {
                const emptyState = getEmptyStateMessage(
                  activeFilter,
                  sessions.length > 0
                );
                return (
                  <Surface style={styles.fullScreenEmptyState} elevation={1}>
                    <Icon
                      source={emptyState.icon}
                      size={64}
                      color={AppColors.outline}
                    />
                    <Text
                      variant="headlineSmall"
                      style={styles.emptyStateTitle}>
                      {emptyState.title}
                    </Text>
                    <Text variant="bodyMedium" style={styles.emptyStateSubtext}>
                      {emptyState.subtitle}
                    </Text>
                  </Surface>
                );
              })()
            ) : (
              <ScrollView
                style={styles.fullScreenScrollView}
                contentContainerStyle={styles.fullScreenScrollContent}
                showsVerticalScrollIndicator={true}>
                {filteredSessions.map((session, index) => (
                  <Card
                    key={session.id}
                    style={styles.fullScreenSessionCard}
                    mode="elevated">
                    <Card.Content>
                      <View style={styles.sessionHeader}>
                        <View style={styles.dateContainer}>
                          <Icon
                            source="calendar"
                            size={20}
                            color={AppColors.primary}
                          />
                          <Text variant="titleMedium" style={styles.dateText}>
                            {formatDate(session.date)}
                          </Text>
                        </View>
                        <Surface style={styles.hoursChip} elevation={1}>
                          <Text variant="titleMedium" style={styles.hoursText}>
                            {session.hours.toFixed(2)} hrs
                          </Text>
                        </Surface>
                      </View>
                      <Divider style={styles.itemDivider} />
                      <View style={styles.timeRow}>
                        <View style={styles.timeItem}>
                          <Icon
                            source="login"
                            size={16}
                            color={AppColors.primary}
                          />
                          <Text variant="bodyMedium" style={styles.timeLabel}>
                            In:
                          </Text>
                          <Text variant="bodyMedium" style={styles.timeValue}>
                            {formatTime(session.clockIn)}
                          </Text>
                        </View>
                        <View style={styles.timeItem}>
                          <Icon
                            source="logout"
                            size={16}
                            color={AppColors.error}
                          />
                          <Text variant="bodyMedium" style={styles.timeLabel}>
                            Out:
                          </Text>
                          <Text variant="bodyMedium" style={styles.timeValue}>
                            {formatTime(session.clockOut)}
                          </Text>
                        </View>
                      </View>
                    </Card.Content>
                  </Card>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
};

export default SessionsHistoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.surface, // Consistent main background
  },
  headerSurface: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: AppColors.surface, // Consistent with main background
  },
  headerSurfaceTablet: {
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'column',
    gap: 12,
    marginTop: 12,
  },
  headerContentSmall: {
    gap: 6,
  },
  headerContentTablet: {
    gap: 14,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  contentContainer: {
    flex: 1,
    padding: 14,
    backgroundColor: AppColors.surface, // Consistent with main background
  },
  contentContainerSmall: {
    padding: 10,
  },
  contentContainerTablet: {
    padding: 20,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  filterControlsContainer: {
    marginBottom: 14,
  },
  filterControlsContainerSmall: {
    marginBottom: 10,
  },
  sessionsContainer: {
    flex: 1,
  },
  sessionsContainerTablet: {
    borderRadius: 10,
    backgroundColor: 'rgba(231, 224, 236, 0.5)', // More subtle surface variant
    padding: 14,
  },
  sessionsListWrapper: {
    flex: 1,
    padding: 8,
    backgroundColor: 'rgba(231, 224, 236, 0.3)', // Lighter surface variant for consistency
    borderRadius: 12,
    marginTop: 8,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
    borderRadius: 14,
    backgroundColor: AppColors.surface, // Consistent main background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
    borderRadius: 14,
    backgroundColor: AppColors.surface, // Consistent main background
  },
  loadingTitle: {
    marginTop: 14,
    marginBottom: 6,
    textAlign: 'center',
    color: AppColors.primary,
    fontWeight: '500',
  },
  loadingSubtext: {
    textAlign: 'center',
    color: AppColors.onSurfaceVariant,
  },
  emptyStateTitle: {
    marginTop: 14,
    marginBottom: 6,
    textAlign: 'center',
    color: AppColors.onSurfaceVariant,
    fontWeight: '500',
  },
  emptyStateSubtext: {
    textAlign: 'center',
    color: AppColors.outline,
  },
  placeholderText: {
    color: AppColors.onSurfaceVariant,
    textAlign: 'center',
    fontWeight: '500',
  },
  placeholderSubtext: {
    color: AppColors.outline,
    textAlign: 'center',
    marginTop: 6,
  },
  listContainer: {
    paddingBottom: 16,
  },
  swipeableContainer: {
    position: 'relative',
    marginBottom: 8,
    marginHorizontal: 3,
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 70,
    backgroundColor: AppColors.error,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 8,
  },
  deleteButton: {
    margin: 0,
    backgroundColor: 'transparent',
  },
  deleteText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 11,
    marginTop: 3,
  },
  deletingCard: {
    backgroundColor: AppColors.errorContainer,
    opacity: 0.7,
  },
  deletingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  deletingText: {
    marginLeft: 6,
    color: AppColors.error,
    fontWeight: '500',
  },
  sessionCard: {
    marginBottom: 8,
    marginHorizontal: 3,
    elevation: 2,
    backgroundColor: AppColors.surface, // Consistent with main background
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontWeight: 'bold',
    marginLeft: 6,
    color: AppColors.onSurface,
  },
  hoursChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: AppColors.primaryContainer,
  },
  hoursText: {
    fontWeight: 'bold',
    color: AppColors.primary,
  },
  itemDivider: {
    marginBottom: 10,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  timeLabel: {
    marginLeft: 3,
    marginRight: 6,
    color: AppColors.onSurfaceVariant,
    fontWeight: '500',
  },
  timeValue: {
    color: AppColors.onSurface,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    marginHorizontal: 14,
    borderRadius: 14,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 6,
    color: AppColors.onSurfaceVariant,
    fontWeight: '500',
  },
  emptySubtext: {
    textAlign: 'center',
    color: AppColors.outline,
  },
  loadingText: {
    marginTop: 14,
    color: AppColors.onSurfaceVariant,
  },
  fullScreenButton: {
    margin: 0,
  },
  fullScreenContainer: {
    flex: 1,
    paddingTop: 16,
    backgroundColor: AppColors.surface, // Consistent main background
    marginTop: 20,
  },
  fullScreenHeader: {
    paddingVertical: 3,
    paddingHorizontal: 14,
    backgroundColor: AppColors.surface, // Consistent with main background
  },
  fullScreenHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fullScreenTitle: {
    fontWeight: 'bold',
    color: AppColors.primary,
    flex: 1,
  },
  closeButton: {
    margin: 0,
    marginLeft: 6,
  },
  totalHoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    backgroundColor: AppColors.primaryContainer,
    borderRadius: 10,
    marginBottom: 3,
  },
  totalHoursTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  totalHoursLabel: {
    color: AppColors.primary,
    fontWeight: '500',
  },
  totalHoursValue: {
    color: AppColors.primary,
    fontWeight: 'bold',
    marginTop: 1,
  },
  sessionCount: {
    color: AppColors.primary,
    fontWeight: '500',
    marginLeft: 10,
  },
  fullScreenContent: {
    flex: 1,
    padding: 6,
    backgroundColor: AppColors.surface, // Consistent with main background
  },
  fullScreenEmptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
    borderRadius: 14,
    backgroundColor: AppColors.surface, // Consistent main background
  },
  fullScreenScrollView: {
    flex: 1,
  },
  fullScreenScrollContent: {
    paddingBottom: 16,
  },
  fullScreenSessionCard: {
    marginBottom: 4,
    elevation: 2,
    backgroundColor: AppColors.surface, // Consistent with main background
  },
});
