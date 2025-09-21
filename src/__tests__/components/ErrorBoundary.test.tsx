import React from 'react';
import { render, fireEvent} from '@testing-library/react-native';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { Text } from 'react-native';

// Component that throws an error for testing
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <Text>No error</Text>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Mock console.error to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render children when there is no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(getByText('No error')).toBeTruthy();
  });

  it('should render error UI when child component throws', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Something went wrong')).toBeTruthy();
    expect(
      getByText(
        "The app encountered an unexpected error. Don't worry, your data is safe."
      )
    ).toBeTruthy();
    expect(getByText('Test error')).toBeTruthy();
    expect(getByText('Try Again')).toBeTruthy();
  });

  it('should reset error state when Try Again is pressed', () => {
    const { getByText, queryByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should show error UI
    expect(getByText('Something went wrong')).toBeTruthy();
    expect(getByText('Try Again')).toBeTruthy();

    // Press Try Again button - this resets the error boundary state
    fireEvent.press(getByText('Try Again'));

    // The error boundary should attempt to re-render children
    // Since the child still throws, it should catch the error again
    expect(getByText('Something went wrong')).toBeTruthy();
  });

  it('should log error details when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(console.error).toHaveBeenCalledWith(
      'ErrorBoundary caught an error:',
      expect.any(Error),
      expect.any(Object)
    );
  });

  it('should handle errors without message', () => {
    const ThrowErrorWithoutMessage = () => {
      const error = new Error();
      error.message = '';
      throw error;
    };

    const { getByText } = render(
      <ErrorBoundary>
        <ThrowErrorWithoutMessage />
      </ErrorBoundary>
    );

    expect(getByText('Unknown error occurred')).toBeTruthy();
  });

  it('should handle multiple children', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Text>Child 1</Text>
        <Text>Child 2</Text>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(getByText('Child 1')).toBeTruthy();
    expect(getByText('Child 2')).toBeTruthy();
    expect(getByText('No error')).toBeTruthy();
  });

  it('should catch errors from any child component', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Text>Child 1</Text>
        <ThrowError shouldThrow={true} />
        <Text>Child 2</Text>
      </ErrorBoundary>
    );

    expect(getByText('Something went wrong')).toBeTruthy();
    expect(getByText('Test error')).toBeTruthy();
  });
});
