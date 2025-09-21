import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, ScrollView } from 'react-native';
import { loadStoredSessions, getStorageKeys } from '../utils/storage';
import { SessionObject } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Debug version of SessionsConsumerExample with detailed logging
 * This component helps you debug storage issues and see what's happening
 */
const SessionsConsumerExample: React.FC = () => {
  const [sessions, setSessions] = useState<SessionObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  // Helper function to add debug messages
  const addDebugMessage = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const debugMessage = `[${timestamp}] ${message}`;
    console.log(debugMessage);
    setDebugInfo(prev => [...prev, debugMessage]);
  };

  useEffect(() => {
    addDebugMessage('Component mounted, starting to load sessions...');
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      addDebugMessage('Starting loadSessions function...');
      
      // Debug: Check if AsyncStorage is available
      addDebugMessage('Checking AsyncStorage availability...');
      const keys = await AsyncStorage.getAllKeys();
      addDebugMessage(`AsyncStorage keys found: ${keys.length} keys`);
      addDebugMessage(`Keys: ${JSON.stringify(keys)}`);
      
      // Debug: Check storage keys
      const storageKeys = getStorageKeys();
      addDebugMessage(`Expected storage keys: ${JSON.stringify(storageKeys)}`);
      
      // Debug: Check if sessions key exists
      const { WORK_SESSIONS_KEY } = storageKeys;
      const hasSessionsKey = keys.includes(WORK_SESSIONS_KEY);
      addDebugMessage(`Sessions key (${WORK_SESSIONS_KEY}) exists: ${hasSessionsKey}`);
      
      if (hasSessionsKey) {
        // Debug: Check raw data
        const rawData = await AsyncStorage.getItem(WORK_SESSIONS_KEY);
        addDebugMessage(`Raw sessions data length: ${rawData?.length || 0} characters`);
        addDebugMessage(`Raw data preview: ${rawData?.substring(0, 100)}...`);
        
        if (rawData) {
          try {
            const parsedData = JSON.parse(rawData);
            addDebugMessage(`Parsed data type: ${typeof parsedData}`);
            addDebugMessage(`Parsed data is array: ${Array.isArray(parsedData)}`);
            addDebugMessage(`Parsed data length: ${parsedData?.length || 0}`);
          } catch (parseError) {
            addDebugMessage(`JSON parse error: ${parseError}`);
          }
        }
      }
      
      // Load sessions using the utility function
      addDebugMessage('Calling loadStoredSessions()...');
      const storedSessions = await loadStoredSessions();
      addDebugMessage(`loadStoredSessions returned ${storedSessions.length} sessions`);
      
      if (storedSessions.length > 0) {
        addDebugMessage(`First session: ${JSON.stringify(storedSessions[0])}`);
      }
      
      setSessions(storedSessions);
      addDebugMessage('Sessions loaded successfully!');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      addDebugMessage(`Error loading sessions: ${errorMessage}`);
      console.error('Failed to load sessions:', err);
      setError(`Failed to load sessions: ${errorMessage}`);
    } finally {
      setLoading(false);
      addDebugMessage('Loading completed');
    }
  };

  // Debug function to manually check storage
  const debugStorage = async () => {
    addDebugMessage('=== MANUAL STORAGE DEBUG ===');
    try {
      const keys = await AsyncStorage.getAllKeys();
      addDebugMessage(`All AsyncStorage keys: ${JSON.stringify(keys)}`);
      
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        addDebugMessage(`Key "${key}": ${value?.substring(0, 50)}...`);
      }
    } catch (err) {
      addDebugMessage(`Storage debug error: ${err}`);
    }
  };

  // Clear debug messages
  const clearDebug = () => {
    setDebugInfo([]);
    addDebugMessage('Debug messages cleared');
  };

  // Refresh sessions (useful if you know sessions have been updated)
  const refreshSessions = () => {
    addDebugMessage('=== REFRESH SESSIONS ===');
    loadSessions();
  };

  if (loading) {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Loading Sessions...</Text>
        <Text style={styles.subtitle}>Debug Information:</Text>
        {debugInfo.map((message, index) => (
          <Text key={index} style={styles.debugMessage}>{message}</Text>
        ))}
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Stored Sessions ({sessions.length})</Text>
      
      {/* Control Buttons */}
      <View style={styles.buttonContainer}>
        <Button title="Refresh" onPress={refreshSessions} />
        <Button title="Debug Storage" onPress={debugStorage} />
        <Button title="Clear Debug" onPress={clearDebug} />
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.error}>{error}</Text>
        </View>
      )}

      {/* Sessions Display */}
      <View style={styles.sessionsContainer}>
        {sessions.length === 0 ? (
          <Text style={styles.noSessions}>No sessions found</Text>
        ) : (
          sessions.map((session) => (
            <View key={session.id} style={styles.sessionItem}>
              <Text style={styles.sessionTitle}>Session {session.id}</Text>
              <Text>Date: {session.date}</Text>
              <Text>Hours: {session.hours.toFixed(2)}</Text>
              <Text>Clock In: {new Date(session.clockIn).toLocaleTimeString()}</Text>
              <Text>Clock Out: {new Date(session.clockOut).toLocaleTimeString()}</Text>
            </View>
          ))
        )}
      </View>

      {/* Debug Information */}
      <View style={styles.debugContainer}>
        <Text style={styles.debugTitle}>Debug Information:</Text>
        {debugInfo.map((message, index) => (
          <Text key={index} style={styles.debugMessage}>{message}</Text>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 8,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  error: {
    color: '#d32f2f',
    textAlign: 'center',
    fontWeight: '500',
  },
  sessionsContainer: {
    marginBottom: 20,
  },
  noSessions: {
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#666',
    padding: 20,
  },
  sessionItem: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  sessionTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#1976d2',
  },
  debugContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#495057',
  },
  debugMessage: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#6c757d',
    marginBottom: 2,
    paddingLeft: 8,
  },
});

export default SessionsConsumerExample;