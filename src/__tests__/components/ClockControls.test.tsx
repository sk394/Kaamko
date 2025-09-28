import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ClockControls } from '../../components/ClockControls';

describe('ClockControls', () => {
  const mockOnClockIn = jest.fn();
  const mockOnClockOut = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders Clock In button when not clocked in', () => {
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

  test('renders Clock Out button when clocked in', () => {
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

  test('calls onClockIn when Clock In button is pressed', () => {
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
  });

  test('calls onClockOut when Clock Out button is pressed', () => {
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
  });
});
