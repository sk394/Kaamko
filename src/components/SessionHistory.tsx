import React, { memo, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import {
  Text,
  Card,
  Divider,
  Icon,
  Surface,
  ActivityIndicator,
  IconButton,
} from 'react-native-paper';
import { formatTime, formatDate } from '../utils/timeUtils';
import { AppColors } from '../theme/colors';
import { SessionObject, FilterType } from '../types';

interface SessionHistoryProps {
  sessions: SessionObject[];
  isLoading?: boolean;
  activeFilter?: FilterType;
  onNavigateToHistory?: () => void;
}

const SessionHistoryComponent: React.FC<SessionHistoryProps> = ({
  sessions,
  isLoading = false,
  activeFilter = 'all',
  onNavigateToHistory,
}) => {
  // Memoize sorted sessions to prevent unnecessary sorting on every render
  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [sessions]);

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

  // Memoize empty state to prevent recreation
  const renderEmptyState = useCallback(
    () => {
      let emptyTitle: string;
      let emptySubtext: string;
      let iconSource: string;

      switch (activeFilter) {
        case 'lastWeek':
          emptyTitle = 'No sessions this week';
          emptySubtext = 'You haven\'t tracked any time in the past 7 days';
          iconSource = 'calendar-week';
          break;
        case 'lastMonth':
          emptyTitle = 'No sessions this month';
          emptySubtext = 'You haven\'t tracked any time in the past 30 days';
          iconSource = 'calendar-month';
          break;
        default:
          emptyTitle = 'No work sessions yet';
          emptySubtext = 'Clock in to start tracking your time';
          iconSource = 'clock-outline';
          break;
      }

      return (
        <Surface style={styles.emptyContainer} elevation={1}>
          <Icon source={iconSource} size={48} color={AppColors.outline} />
          <Text variant="headlineSmall" style={styles.emptyText}>
            {emptyTitle}
          </Text>
          <Text variant="bodyMedium" style={styles.emptySubtext}>
            {emptySubtext}
          </Text>
        </Surface>
      );
    },
    [activeFilter]
  );

  // Memoize key extractor for FlatList performance
  const keyExtractor = useCallback((item: SessionObject) => item.id, []);

  return (
    <View style={styles.container}>
      <Surface style={styles.headerSurface} elevation={1}>
        <View style={styles.titleContainer}>
          <View style={styles.titleLeft}>
            <Icon source="history" size={24} color={AppColors.primary} />
            <Text variant="headlineSmall" style={styles.title}>
              Session History
            </Text>
          </View>
          {onNavigateToHistory && (
            <IconButton
              icon="arrow-right"
              size={24}
              iconColor={AppColors.primary}
              onPress={onNavigateToHistory}
              style={styles.navigationButton}
            />
          )}
        </View>
      </Surface>

      {isLoading ? (
        <Surface style={styles.loadingContainer} elevation={1}>
          <ActivityIndicator size="large" />
          <Text variant="bodyMedium" style={styles.loadingText}>
            Loading sessions...
          </Text>
        </Surface>
      ) : sortedSessions.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={sortedSessions}
          renderItem={renderSessionItem}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={5}
          getItemLayout={(data, index) => ({
            length: 120, // Approximate item height
            offset: 120 * index,
            index,
          })}
        />
      )}
    </View>
  );
};

// Memoize component to prevent unnecessary re-renders
// Only re-render when sessions array, loading state, active filter, or navigation handler changes
export const SessionHistory = memo(
  SessionHistoryComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.isLoading === nextProps.isLoading &&
      prevProps.activeFilter === nextProps.activeFilter &&
      prevProps.onNavigateToHistory === nextProps.onNavigateToHistory &&
      prevProps.sessions.length === nextProps.sessions.length &&
      prevProps.sessions.every(
        (session, index) => session.id === nextProps.sessions[index]?.id
      )
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 8,
  },
  headerSurface: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  navigationButton: {
    margin: 0,
  },
  title: {
    marginLeft: 8,
    fontWeight: 'bold',
    color: AppColors.primary,
  },
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    marginHorizontal: 16,
    borderRadius: 16,
  },
  loadingText: {
    marginTop: 16,
    color: AppColors.onSurfaceVariant,
  },
});
