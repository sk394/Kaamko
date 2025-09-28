import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import {
  addTestSessions,
  clearAllSessions,
  inspectStorage,
  testLoadStoredSessions,
  runCompleteDebugTest,
  quickDebug,
} from '../utils/debugStorage';

const StorageDebugger: React.FC = () => {
  const [debugResult, setDebugResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleAddTestSessions = async () => {
    try {
      setLoading(true);
      await addTestSessions();
      setDebugResult('✅ Test sessions added successfully');
      Alert.alert('Success', 'Test sessions added');
    } catch (error) {
      const message = `❌ Failed to add test sessions: ${error}`;
      setDebugResult(message);
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSessions = async () => {
    try {
      setLoading(true);
      await clearAllSessions();
      setDebugResult('✅ All sessions cleared');
      Alert.alert('Success', 'All sessions cleared');
    } catch (error) {
      const message = `❌ Failed to clear sessions: ${error}`;
      setDebugResult(message);
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleInspectStorage = async () => {
    try {
      setLoading(true);
      await inspectStorage();
      setDebugResult('✅ Storage inspection complete (check console)');
    } catch (error) {
      const message = `❌ Storage inspection failed: ${error}`;
      setDebugResult(message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestLoad = async () => {
    try {
      setLoading(true);
      const sessions = await testLoadStoredSessions();
      setDebugResult(
        `✅ Loaded ${sessions.length} sessions (check console for details)`
      );
    } catch (error) {
      const message = `❌ Failed to load sessions: ${error}`;
      setDebugResult(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTest = async () => {
    try {
      setLoading(true);
      await runCompleteDebugTest();
      setDebugResult('✅ Complete debug test finished (check console)');
    } catch (error) {
      const message = `❌ Complete test failed: ${error}`;
      setDebugResult(message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDebug = async () => {
    try {
      setLoading(true);
      const result = await quickDebug();
      const message = `Quick Debug Result:
- Has sessions key: ${result.hasSessionsKey}
- Sessions count: ${result.sessionsCount}
- Raw data length: ${result.rawData?.length || 0}
- Error: ${result.error || 'None'}`;
      setDebugResult(message);
    } catch (error) {
      setDebugResult(`❌ Quick debug failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔧 Storage Debugger</Text>
      <Text style={styles.subtitle}>
        Use these buttons to debug storage issues
      </Text>

      <View style={styles.buttonGrid}>
        <Button
          title="Quick Debug"
          onPress={handleQuickDebug}
          disabled={loading}
        />
        <Button
          title="Inspect Storage"
          onPress={handleInspectStorage}
          disabled={loading}
        />
        <Button title="Test Load" onPress={handleTestLoad} disabled={loading} />
        <Button
          title="Add Test Data"
          onPress={handleAddTestSessions}
          disabled={loading}
        />
        <Button
          title="Clear All"
          onPress={handleClearSessions}
          disabled={loading}
        />
        <Button
          title="Complete Test"
          onPress={handleCompleteTest}
          disabled={loading}
        />
      </View>

      {loading && <Text style={styles.loading}>⏳ Processing...</Text>}

      {debugResult && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Result:</Text>
          <Text style={styles.result}>{debugResult}</Text>
        </View>
      )}

      <Text style={styles.note}>
        💡 Check the console/logs for detailed information
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#dee2e6',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#495057',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    color: '#6c757d',
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  loading: {
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#007bff',
    marginBottom: 16,
  },
  resultContainer: {
    backgroundColor: '#e9ecef',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  resultTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#495057',
  },
  result: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#212529',
  },
  note: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#6c757d',
  },
});

export default StorageDebugger;
