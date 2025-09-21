import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Animated, FlatList } from 'react-native';
import { Text, Surface, Icon, IconButton, ActivityIndicator, Card, Divider } from 'react-native-paper';
import { AppColors } from '../theme/colors';
import { FilterType, SessionObject } from '../types';
import FilterControls from './FilterControls';
import { getLastWeekDateRange, getLastMonthDateRange, isDateInRange, formatDate, formatTime, getThisWeekDateRange } from '../utils/timeUtils';
import { useSessionsContext } from '../contexts/SessionsContext';
import { clearStoredData } from '../utils/storage';

/**
 * Get display name for filter type
 * @param filter - Filter type
 * @returns Human-readable filter name
 */
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

/**
 * Get appropriate empty state message based on filter and session data
 * @param filter - Current active filter
 * @param hasAnySessions - Whether there are any sessions in the full dataset
 * @returns Object with title and subtitle for empty state
 */
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

interface SessionsHistoryScreenProps {
  /** Callback function to navigate back to main screen */
  onNavigateBack: () => void;
}

const SessionsHistoryScreen: React.FC<SessionsHistoryScreenProps> = ({ onNavigateBack }) => {
  const { sessions, loading, refreshSessions } = useSessionsContext();
  // Delete all sessions handler
  const handleDeleteAllSessions = async () => {
    await clearStoredData();
    await refreshSessions();
  };
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [contentAnimation] = useState(new Animated.Value(0));

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

  const handleFilterChange = useCallback((filter: FilterType) => {
    setActiveFilter(filter);
  }, []);

  const dateRanges = useMemo(() => ({
    lastWeek: getLastWeekDateRange(),
    lastMonth: getLastMonthDateRange(),
    thisWeek: getThisWeekDateRange(),
  }), []);

  const filteredSessions = useMemo(() => {
    if (activeFilter === 'all') {
      return [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
      .filter(session => isDateInRange(session.date, startDate, endDate))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sessions, activeFilter, dateRanges]);

  const isSmallScreen = screenData.width < 400;
  const isTablet = screenData.width >= 768;

  // Memoize render function to prevent recreation on every render
  const renderSessionItem = useCallback(
    ({ item }: { item: SessionObject }) => (
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
    ),
    []
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
      ]}
    >
      {/* Header section with title and back navigation - responsive design */}
      <Surface style={[
        styles.headerSurface,
        isTablet && styles.headerSurfaceTablet,
      ]} elevation={2}>
        <View style={[
          styles.headerContent,
          isSmallScreen && styles.headerContentSmall,
          isTablet && styles.headerContentTablet,
        ]}>
          <View style={[
            styles.navigationContainer,
            isSmallScreen && styles.navigationContainerSmall,
          ]}>
            <IconButton
              icon="arrow-left"
              size={isSmallScreen ? 20 : 24}
              iconColor={AppColors.primary}
              onPress={onNavigateBack}
              style={styles.backButton}
            />
            <Text
              variant={isSmallScreen ? "bodySmall" : "bodyMedium"}
              style={styles.backText}
            >
              Back to Main
            </Text>
          </View>
        </View>
      </Surface>

      {/* Main content area - responsive padding */}
      <View style={[
        styles.contentContainer,
        isSmallScreen && styles.contentContainerSmall,
        isTablet && styles.contentContainerTablet,
      ]}>
        {/* Filter controls and delete button */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={[
            styles.filterControlsContainer,
            isSmallScreen && styles.filterControlsContainerSmall,
          ]}>
            <FilterControls
              activeFilter={activeFilter}
              onFilterChange={handleFilterChange}
            />
          </View>
          <View style={{ marginLeft: 2 }}>
            <IconButton
              icon="delete"
              size={24}
              iconColor={AppColors.error}
              onPress={handleDeleteAllSessions}
              style={{ backgroundColor: AppColors.errorContainer, borderRadius: 20 }}
              accessibilityLabel="Delete all sessions"
              accessibilityHint="Deletes all work sessions permanently"
            />
          </View>
        </View>

        {/* Sessions display area - responsive layout */}
        <View style={[
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
              const emptyState = getEmptyStateMessage(activeFilter, sessions.length > 0);
              return (
                <Surface style={styles.emptyStateContainer} elevation={1}>
                  <Icon source={emptyState.icon} size={64} color={AppColors.outline} />
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
              <Text variant="bodyMedium" style={styles.placeholderText}>
                Showing {filteredSessions.length} of {sessions.length} session{sessions.length !== 1 ? 's' : ''}
                {activeFilter !== 'all' && ` (${getFilterDisplayName(activeFilter)})`}
              </Text>
              <Text variant="bodySmall" style={styles.placeholderSubtext}>
                Total Hours: {filteredSessions.reduce((total, session) => total + session.hours, 0).toFixed(2)}
              </Text>
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
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

export default SessionsHistoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.surface,
  },
  headerSurface: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: AppColors.surface,
  },
  headerSurfaceTablet: {
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'column',
    gap: 15,
    marginTop: 15,

  },
  headerContentSmall: {
    gap: 8,
  },
  headerContentTablet: {
    gap: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  titleContainerSmall: {
    gap: 8,
  },
  title: {
    fontWeight: 'bold',
    color: AppColors.primary,
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  navigationContainerSmall: {
    paddingVertical: 2,
  },
  backButton: {
    margin: 0,
  },
  backText: {
    color: AppColors.primary,
    fontWeight: '500',
    marginLeft: 4,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  contentContainerSmall: {
    padding: 12,
  },
  contentContainerTablet: {
    padding: 24,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  filterControlsContainer: {
    marginBottom: 16,
  },
  filterControlsContainerSmall: {
    marginBottom: 12,
  },
  sessionsContainer: {
    flex: 1,
  },
  sessionsContainerTablet: {
    borderRadius: 12,
    backgroundColor: AppColors.surfaceVariant,
    padding: 16,
  },
  sessionsListWrapper: {
    flex: 1,
    padding: 8,
    backgroundColor: AppColors.surfaceVariant,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
    backgroundColor: AppColors.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
    backgroundColor: AppColors.surface,
  },
  loadingTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
    color: AppColors.primary,
    fontWeight: '500',
  },
  loadingSubtext: {
    textAlign: 'center',
    color: AppColors.onSurfaceVariant,
  },
  emptyStateTitle: {
    marginTop: 16,
    marginBottom: 8,
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
    marginTop: 8,
  },
  // Removed unused/duplicate styles
  listContainer: {
    paddingBottom: 16,
  },
  sessionCard: {
    marginBottom: 12,
    marginHorizontal: 4,
    elevation: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontWeight: 'bold',
    marginLeft: 8,
    color: AppColors.onSurface,
  },
  hoursChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: AppColors.primaryContainer,
  },
  hoursText: {
    fontWeight: 'bold',
    color: AppColors.primary,
  },
  itemDivider: {
    marginBottom: 12,
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
    marginLeft: 4,
    marginRight: 8,
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
    paddingVertical: 60,
    marginHorizontal: 16,
    borderRadius: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
    color: AppColors.onSurfaceVariant,
    fontWeight: '500',
  },
  emptySubtext: {
    textAlign: 'center',
    color: AppColors.outline,
  },
  loadingText: {
    marginTop: 16,
    color: AppColors.onSurfaceVariant,
  },
});