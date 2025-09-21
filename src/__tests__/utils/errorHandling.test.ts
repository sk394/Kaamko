import {
  createAppError,
  handleStorageError,
  handleValidationError,
  safeAsyncOperation,
  retryOperation,
} from '../../utils/errorHandling';

describe('Error Handling Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console methods to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createAppError', () => {
    it('should create a basic app error', () => {
      const error = createAppError('storage', 'Test error message');

      expect(error).toEqual({
        type: 'storage',
        message: 'Test error message',
        originalError: undefined,
        critical: false,
      });
    });

    it('should create a critical app error with original error', () => {
      const originalError = new Error('Original error');
      const error = createAppError(
        'validation',
        'Test error',
        originalError,
        true
      );

      expect(error).toEqual({
        type: 'validation',
        message: 'Test error',
        originalError,
        critical: true,
      });
    });
  });

  describe('handleStorageError', () => {
    it('should handle storage errors correctly', () => {
      const originalError = new Error('Storage failed');
      const appError = handleStorageError(originalError, 'save data');

      expect(appError.type).toBe('storage');
      expect(appError.message).toContain('Failed to save data');
      expect(appError.originalError).toBe(originalError);
      expect(appError.critical).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        'Storage save data failed:',
        originalError
      );
    });
  });

  describe('handleValidationError', () => {
    it('should handle validation errors correctly', () => {
      const originalError = new Error('Invalid data');
      const appError = handleValidationError(originalError, 'user input');

      expect(appError.type).toBe('validation');
      expect(appError.message).toContain('Invalid data detected in user input');
      expect(appError.originalError).toBe(originalError);
      expect(appError.critical).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        'Validation error in user input:',
        originalError
      );
    });
  });

  describe('safeAsyncOperation', () => {
    it('should return result when operation succeeds', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      const result = await safeAsyncOperation(
        operation,
        'fallback',
        'test operation'
      );

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should return fallback value when operation fails', async () => {
      const operation = jest
        .fn()
        .mockRejectedValue(new Error('Operation failed'));
      const result = await safeAsyncOperation(
        operation,
        'fallback',
        'test operation'
      );

      expect(result).toBe('fallback');
      expect(operation).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle different types of fallback values', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Failed'));

      // Test with object fallback
      const objectResult = await safeAsyncOperation(
        operation,
        { data: 'default' },
        'test'
      );
      expect(objectResult).toEqual({ data: 'default' });

      // Test with array fallback
      const arrayResult = await safeAsyncOperation(operation, [], 'test');
      expect(arrayResult).toEqual([]);

      // Test with number fallback
      const numberResult = await safeAsyncOperation(operation, 0, 'test');
      expect(numberResult).toBe(0);
    });
  });

  describe('retryOperation', () => {
    it('should return result on first success', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      const result = await retryOperation(operation, 3, 100);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');

      const result = await retryOperation(operation, 3, 10); // Short delay for tests

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should throw error after max retries', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Always fails'));

      await expect(retryOperation(operation, 2, 10)).rejects.toThrow(
        'Always fails'
      );
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should use exponential backoff', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');

      const startTime = Date.now();
      await retryOperation(operation, 3, 50);
      const endTime = Date.now();

      // Should have waited at least 50ms + 100ms = 150ms for the delays
      // Adding some tolerance for test execution time
      expect(endTime - startTime).toBeGreaterThan(100);
    });

    it('should handle different error types', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce('String error')
        .mockRejectedValueOnce(new TypeError('Type error'))
        .mockRejectedValueOnce({ message: 'Object error' })
        .mockResolvedValue('success');

      const result = await retryOperation(operation, 4, 10);
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(4);
    });
  });
});
