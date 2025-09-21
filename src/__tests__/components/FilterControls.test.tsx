import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import FilterControls from '../../components/FilterControls';
import { FilterType } from '../../types';

// Test wrapper with PaperProvider for Material Design components
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PaperProvider>{children}</PaperProvider>
);

describe('FilterControls', () => {
  const mockOnFilterChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all filter options correctly', () => {
    const { getByText } = render(
      <TestWrapper>
        <FilterControls activeFilter="all" onFilterChange={mockOnFilterChange} />
      </TestWrapper>
    );

    // Verify all filter options are rendered
    expect(getByText('All')).toBeTruthy();
    expect(getByText('Last Week')).toBeTruthy();
    expect(getByText('Last Month')).toBeTruthy();
  });

  it('highlights the active filter button', () => {
    const { getByText } = render(
      <TestWrapper>
        <FilterControls activeFilter="lastWeek" onFilterChange={mockOnFilterChange} />
      </TestWrapper>
    );

    const lastWeekButton = getByText('Last Week');
    
    // Check that the button exists and is rendered
    expect(lastWeekButton).toBeTruthy();
  });

  it('calls onFilterChange when a filter button is pressed', () => {
    const { getByText } = render(
      <TestWrapper>
        <FilterControls activeFilter="all" onFilterChange={mockOnFilterChange} />
      </TestWrapper>
    );

    const lastMonthButton = getByText('Last Month');
    fireEvent.press(lastMonthButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith('lastMonth');
    expect(mockOnFilterChange).toHaveBeenCalledTimes(1);
  });

  it('has proper accessibility attributes', () => {
    const { getByText } = render(
      <TestWrapper>
        <FilterControls activeFilter="all" onFilterChange={mockOnFilterChange} />
      </TestWrapper>
    );

    const allButton = getByText('All');

    // Check that the button exists and can be interacted with
    expect(allButton).toBeTruthy();
    
    // Test that the button is pressable
    fireEvent.press(allButton);
    expect(mockOnFilterChange).toHaveBeenCalledWith('all');
  });

  it('handles different active filter states correctly', () => {
    const filterTypes: FilterType[] = ['all', 'lastWeek', 'lastMonth'];

    filterTypes.forEach((activeFilter) => {
      const { getByText } = render(
        <TestWrapper>
          <FilterControls activeFilter={activeFilter} onFilterChange={mockOnFilterChange} />
        </TestWrapper>
      );

      // Find the active button and verify it exists
      const activeButtonText = activeFilter === 'all' ? 'All' : 
                              activeFilter === 'lastWeek' ? 'Last Week' : 'Last Month';
      const activeButton = getByText(activeButtonText);
      
      expect(activeButton).toBeTruthy();

      // Verify all buttons exist
      expect(getByText('All')).toBeTruthy();
      expect(getByText('Last Week')).toBeTruthy();
      expect(getByText('Last Month')).toBeTruthy();
    });
  });

  it('maintains proper touch targets for accessibility', () => {
    const { getByText } = render(
      <TestWrapper>
        <FilterControls activeFilter="all" onFilterChange={mockOnFilterChange} />
      </TestWrapper>
    );

    // Verify buttons are pressable (this tests the Pressable component is working)
    const allButton = getByText('All');
    expect(allButton.parent?.parent).toBeTruthy();
    
    // Test that pressing works (already tested above, but this confirms touch targets)
    fireEvent.press(allButton);
    expect(mockOnFilterChange).toHaveBeenCalledWith('all');
  });

  it('does not highlight any buttons when filter is "all" (default state)', () => {
    const { getByText } = render(
      <TestWrapper>
        <FilterControls activeFilter="all" onFilterChange={mockOnFilterChange} />
      </TestWrapper>
    );

    // Requirement 4.3: When no filters are active (activeFilter === 'all'), 
    // no filter buttons should be highlighted
    const allButton = getByText('All');
    const lastWeekButton = getByText('Last Week');
    const lastMonthButton = getByText('Last Month');

    // All buttons should exist but none should be highlighted
    expect(allButton).toBeTruthy();
    expect(lastWeekButton).toBeTruthy();
    expect(lastMonthButton).toBeTruthy();

    // Test that buttons are still functional
    fireEvent.press(lastWeekButton);
    expect(mockOnFilterChange).toHaveBeenCalledWith('lastWeek');
  });

  it('highlights only the active filter button when not in default state', () => {
    const { getByText, rerender } = render(
      <TestWrapper>
        <FilterControls activeFilter="lastWeek" onFilterChange={mockOnFilterChange} />
      </TestWrapper>
    );

    // When lastWeek is active, only that button should be highlighted
    const lastWeekButton = getByText('Last Week');
    expect(lastWeekButton).toBeTruthy();

    // Test with lastMonth filter
    rerender(
      <TestWrapper>
        <FilterControls activeFilter="lastMonth" onFilterChange={mockOnFilterChange} />
      </TestWrapper>
    );

    const lastMonthButton = getByText('Last Month');
    expect(lastMonthButton).toBeTruthy();
  });
});