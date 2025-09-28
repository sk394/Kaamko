import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ClockControls } from '../../components/ClockControls';

describe('ClockControls Component', () => {
  const mockOnClockIn = jest.fn();
  const mockOnClockOut = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Conditional Rendering', () => {
    it('should display Clock In button when not clocked in (Requirement 1.1)', () => {
      const { getByText, queryByText } = render(
        <ClockControls
          isClocked={false}
          onClockIn={mockOnClockIn}
          onClockOut={mockOnClockOut}
          disabled={false}
        />
      );

      expect(getByText('Clock In')).toBeTruthy();
      expect(queryByText('Clock Out')).toBeNull();
    });

    it('should display Clock Out button when clocked in (Requirement 2.1)', () => {
      const { getByText, queryByText } = render(
        <ClockControls
          isClocked={true}
          onClockIn={mockOnClockIn}
          onClockOut={mockOnClockOut}
          disabled={false}
        />
      );

      expect(getByText('Clock Out')).toBeTruthy();
      expect(queryByText('Clock In')).toBeNull();
    });

    it('should not display Clock In button when already clocked in (Requirement 1.5)', () => {
      const { queryByText } = render(
        <ClockControls
          isClocked={true}
          onClockIn={mockOnClockIn}
          onClockOut={mockOnClockOut}
          disabled={false}
        />
      );

      expect(queryByText('Clock In')).toBeNull();
    });

    it('should not display Clock Out button when not clocked in (Requirement 2.6)', () => {
      const { queryByText } = render(
        <ClockControls
          isClocked={false}
          onClockIn={mockOnClockIn}
          onClockOut={mockOnClockOut}
          disabled={false}
        />
      );

      expect(queryByText('Clock Out')).toBeNull();
    });
  });

  describe('Button Press Events', () => {
    it('should call onClockIn when Clock In button is pressed', () => {
      const { getByText } = render(
        <ClockControls
          isClocked={false}
          onClockIn={mockOnClockIn}
          onClockOut={mockOnClockOut}
          disabled={false}
        />
      );

      fireEvent.press(getByText('Clock In'));
      expect(mockOnClockIn).toHaveBeenCalledTimes(1);
      expect(mockOnClockOut).not.toHaveBeenCalled();
    });

    it('should call onClockOut when Clock Out button is pressed', () => {
      const { getByText } = render(
        <ClockControls
          isClocked={true}
          onClockIn={mockOnClockIn}
          onClockOut={mockOnClockOut}
          disabled={false}
        />
      );

      fireEvent.press(getByText('Clock Out'));
      expect(mockOnClockOut).toHaveBeenCalledTimes(1);
      expect(mockOnClockIn).not.toHaveBeenCalled();
    });
  });

  describe('Disabled States and Visual Feedback (Requirements 7.2, 7.5)', () => {
    it('should disable Clock In button when disabled prop is true', () => {
      const { getByText } = render(
        <ClockControls
          isClocked={false}
          onClockIn={mockOnClockIn}
          onClockOut={mockOnClockOut}
          disabled={true}
        />
      );

      const clockInButton = getByText('Clock In');
      expect(clockInButton).toBeTruthy();

      // Test that button press doesn't trigger callback when disabled
      fireEvent.press(clockInButton);
      expect(mockOnClockIn).not.toHaveBeenCalled();
    });

    it('should disable Clock Out button when disabled prop is true', () => {
      const { getByText } = render(
        <ClockControls
          isClocked={true}
          onClockIn={mockOnClockIn}
          onClockOut={mockOnClockOut}
          disabled={true}
        />
      );

      const clockOutButton = getByText('Clock Out');
      expect(clockOutButton).toBeTruthy();

      // Test that button press doesn't trigger callback when disabled
      fireEvent.press(clockOutButton);
      expect(mockOnClockOut).not.toHaveBeenCalled();
    });

    it('should provide clear visual feedback with labeled buttons (Requirement 7.2)', () => {
      // Test Clock In button label
      const { rerender, getByText } = render(
        <ClockControls
          isClocked={false}
          onClockIn={mockOnClockIn}
          onClockOut={mockOnClockOut}
          disabled={false}
        />
      );

      expect(getByText('Clock In')).toBeTruthy();

      // Test Clock Out button label
      rerender(
        <ClockControls
          isClocked={true}
          onClockIn={mockOnClockIn}
          onClockOut={mockOnClockOut}
          disabled={false}
        />
      );

      expect(getByText('Clock Out')).toBeTruthy();
    });
  });

  describe('Component Props and Interface', () => {
    it('should accept all required props without errors', () => {
      const { getByText } = render(
        <ClockControls
          isClocked={false}
          onClockIn={mockOnClockIn}
          onClockOut={mockOnClockOut}
          disabled={false}
        />
      );

      expect(getByText('Clock In')).toBeTruthy();
    });

    it('should handle prop changes correctly', () => {
      const { rerender, getByText, queryByText } = render(
        <ClockControls
          isClocked={false}
          onClockIn={mockOnClockIn}
          onClockOut={mockOnClockOut}
          disabled={false}
        />
      );

      // Initially shows Clock In
      expect(getByText('Clock In')).toBeTruthy();
      expect(queryByText('Clock Out')).toBeNull();

      // After rerender with isClocked=true, shows Clock Out
      rerender(
        <ClockControls
          isClocked={true}
          onClockIn={mockOnClockIn}
          onClockOut={mockOnClockOut}
          disabled={false}
        />
      );

      expect(getByText('Clock Out')).toBeTruthy();
      expect(queryByText('Clock In')).toBeNull();
    });
  });

  describe('Integration with Parent Callbacks', () => {
    it('should call parent callbacks with correct timing', () => {
      const { getByText } = render(
        <ClockControls
          isClocked={false}
          onClockIn={mockOnClockIn}
          onClockOut={mockOnClockOut}
          disabled={false}
        />
      );

      // Multiple presses should call callback multiple times
      const clockInButton = getByText('Clock In');
      fireEvent.press(clockInButton);
      fireEvent.press(clockInButton);

      expect(mockOnClockIn).toHaveBeenCalledTimes(2);
    });

    it('should work with different callback functions', () => {
      const customClockIn = jest.fn();
      const customClockOut = jest.fn();

      const { getByText } = render(
        <ClockControls
          isClocked={false}
          onClockIn={customClockIn}
          onClockOut={customClockOut}
          disabled={false}
        />
      );

      fireEvent.press(getByText('Clock In'));
      expect(customClockIn).toHaveBeenCalledTimes(1);
      expect(mockOnClockIn).not.toHaveBeenCalled();
    });
  });
});
