// Error handling utilities
import { Alert } from 'react-native';

export interface AppError {
  type: 'storage' | 'validation' | 'network' | 'unknown';
  message: string;
  originalError?: Error;
  critical?: boolean;
}

/**
 * Create a standardized app error
 */
export const createAppError = (
  type: AppError['type'],
  message: string,
  originalError?: Error,
  critical = false
): AppError => ({
  type,
  message,
  originalError,
  critical,
});

/**
 * Handle storage-related errors
 */
export const handleStorageError = (
  error: Error,
  operation: string
): AppError => {
  console.error(`Storage ${operation} failed:`, error);

  const appError = createAppError(
    'storage',
    `Failed to ${operation}. The app will continue working, but changes may not be saved.`,
    error,
    false // Storage errors are not critical - app can continue with in-memory state
  );

  return appError;
};

/**
 * Handle validation errors
 */
export const handleValidationError = (
  error: Error,
  context: string
): AppError => {
  console.error(`Validation error in ${context}:`, error);

  return createAppError(
    'validation',
    `Invalid data detected in ${context}. Using default values.`,
    error,
    false
  );
};

/**
 * Show user-friendly error message
 */
export const showErrorToUser = (appError: AppError, showAlert = true): void => {
  if (showAlert && appError.critical) {
    Alert.alert('Error', appError.message, [{ text: 'OK', style: 'default' }], {
      cancelable: false,
    });
  } else if (showAlert) {
    // For non-critical errors, we could show a toast or banner
    // For now, we'll just log them
    console.warn('Non-critical error:', appError.message);
  }
};

/**
 * Safely execute an async operation with error handling
 */
export const safeAsyncOperation = async <T>(
  operation: () => Promise<T>,
  fallbackValue: T,
  errorContext: string
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    const appError = handleStorageError(error as Error, errorContext);
    showErrorToUser(appError, false); // Don't show alert for storage errors
    return fallbackValue;
  }
};

/**
 * Retry an operation with exponential backoff
 */
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
};
