import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useSessions, useRecentSessions, useFilteredSessions } from '../hooks/useSessions';

/**
 * Example component showing different ways to use the sessions hooks
 */
const SessionsHookExample: React.FC = () => {
  // Get all sessions
  const { 
    sessions, 
    loading, 
    error, 
    refreshSessions, 
    totalHours, 
    sessionCount 
  } = useSessions();

  // Get only recent 5 sessions
  const { 
    sessions: recentSessions, 
    totalHours: recentTotalHours 
  } = useRecentSessions(5);

  // Get sessions from today only
  const today = new Date().toISOString().split('T')[0];
  const { 
    sessions: todaySessions, 
    totalHours: todayHours 
  } = useFilteredSessions(
    (session) => session.date === today
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading sessions...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error}</Text>
        <Button title="Retry" onPress={refreshSessions} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sessions Dashboard</Text>
      
      {/* All Sessions Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Sessions</Text>
        <Text>Total Sessions: {sessionCount}</Text>
        <Text>Total Hours: {totalHours.toFixed(2)}</Text>
      </View>

      {/* Today's Sessions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Sessions</Text>
        <Text>Sessions Today: {todaySessions.length}</Text>
        <Text>Hours Today: {todayHours.toFixed(2)}</Text>
      </View>

      {/* Recent Sessions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent 5 Sessions</Text>
        <Text>Recent Hours: {recentTotalHours.toFixed(2)}</Text>
        {recentSessions.map((session) => (
          <View key={session.id} style={styles.sessionItem}>
            <Text>{session.date} - {session.hours.toFixed(2)}h</Text>
          </View>
        ))}
      </View>

      <Button title="Refresh Sessions" onPress={refreshSessions} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sessionItem: {
    backgroundColor: 'white',
    padding: 8,
    marginTop: 4,
    borderRadius: 4,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 16,
  },
});

export default SessionsHookExample;