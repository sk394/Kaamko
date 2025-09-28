import React, { Component, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Text variant="headlineMedium" style={styles.title}>
              Something went wrong
            </Text>
            <Text variant="bodyLarge" style={styles.message}>
              The app encountered an unexpected error. Don't worry, your
              data is safe.
            </Text>
            <Text variant="bodyMedium" style={styles.details}>
              {this.state.error?.message || 'Unknown error occurred'}
            </Text>
            <Button
              mode="contained"
              onPress={this.handleReset}
              style={styles.button}>
              Try Again
            </Button>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#d32f2f',
  },
  message: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#666',
  },
  details: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#999',
    fontStyle: 'italic',
  },
  button: {
    minWidth: 120,
  },
});
