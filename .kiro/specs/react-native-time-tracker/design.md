# Design Document

## Overview

The React Native Time Tracker app will be built using Expo and functional React components with hooks. The architecture follows a simple, single-screen design with local state management and AsyncStorage for persistence. The app will use React Native's built-in components and React Native Paper for enhanced UI elements, ensuring full compatibility with Expo Go.

The core design principle is simplicity - a single main screen that handles all user interactions with clear visual feedback and reliable data persistence.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────┐
│            App Component            │
│  (Main container with state mgmt)   │
└─────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
┌───────▼────┐ ┌────▼────┐ ┌────▼──────┐
│   Clock    │ │ Status  │ │  Session  │
│ Controls   │ │Display  │ │  History  │
│Component   │ │Component│ │ Component │
└────────────┘ └─────────┘ └───────────┘
                    │
        ┌───────────▼───────────┐
        │    AsyncStorage       │
        │   (Data Persistence)  │
        └───────────────────────┘
```

### Data Flow

1. **App Launch**: Load existing state from AsyncStorage
2. **Clock In**: Update state → Save to AsyncStorage → Update UI
3. **Clock Out**: Calculate hours → Save session → Update state → Save to AsyncStorage → Update UI
4. **Display**: Read from state → Render components

## Components and Interfaces

### Main App Component (`App.js`)

**Responsibilities:**
- Manage global application state
- Handle AsyncStorage operations
- Coordinate between child components
- Manage app lifecycle events

**State Structure:**
```javascript
{
  isClocked: boolean,
  clockInTime: Date | null,
  sessions: Array<SessionObject>,
  loading: boolean
}
```

**Key Methods:**
- `loadStoredData()`: Initialize app state from AsyncStorage
- `handleClockIn()`: Process clock-in action
- `handleClockOut()`: Process clock-out action and save session
- `saveCurrentState()`: Persist current state to AsyncStorage

### ClockControls Component

**Props Interface:**
```javascript
{
  isClocked: boolean,
  onClockIn: () => void,
  onClockOut: () => void,
  disabled: boolean
}
```

**Responsibilities:**
- Render Clock In/Clock Out buttons based on current state
- Handle user interactions and call parent callbacks
- Provide visual feedback for button states

### StatusDisplay Component

**Props Interface:**
```javascript
{
  isClocked: boolean,
  clockInTime: Date | null
}
```

**Responsibilities:**
- Display current clock status
- Format and show clock-in time when applicable
- Provide clear visual indication of current state

### SessionHistory Component

**Props Interface:**
```javascript
{
  sessions: Array<SessionObject>
}
```

**Responsibilities:**
- Render list of past work sessions
- Format session data for display
- Handle empty state when no sessions exist

## Data Models

### SessionObject

```javascript
{
  id: string,           // UUID for unique identification
  date: string,         // Format: "YYYY-MM-DD"
  clockIn: string,      // ISO 8601 timestamp
  clockOut: string,     // ISO 8601 timestamp
  hours: number         // Calculated hours worked (decimal)
}
```

### AsyncStorage Keys

- `CLOCK_STATE`: Current clock-in state
  ```javascript
  {
    isClocked: boolean,
    clockInTime: string | null  // ISO 8601 timestamp
  }
  ```

- `WORK_SESSIONS`: Array of all completed sessions
  ```javascript
  [SessionObject, SessionObject, ...]
  ```

### Utility Functions

**Time Calculations:**
```javascript
// Calculate hours between two timestamps
const calculateHours = (startTime, endTime) => {
  const diffMs = new Date(endTime) - new Date(startTime);
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
};

// Format time for display
const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Format date for display
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};
```

## Error Handling

### AsyncStorage Error Handling

**Strategy**: Graceful degradation with user feedback

```javascript
const handleStorageError = (error, operation) => {
  console.error(`AsyncStorage ${operation} failed:`, error);
  // Continue with in-memory state
  // Show user-friendly error message if critical
};
```

**Error Scenarios:**
1. **Storage Read Failure**: Continue with default state, log error
2. **Storage Write Failure**: Continue operation, show warning to user
3. **Data Corruption**: Reset to clean state, preserve what's recoverable

### State Management Error Handling

**Invalid State Recovery:**
- Validate loaded data structure
- Reset to default state if corruption detected
- Preserve user sessions when possible

**Clock State Validation:**
```javascript
const validateClockState = (state) => {
  if (!state || typeof state.isClocked !== 'boolean') {
    return { isClocked: false, clockInTime: null };
  }
  
  if (state.isClocked && !state.clockInTime) {
    return { isClocked: false, clockInTime: null };
  }
  
  return state;
};
```

## Testing Strategy

### Unit Testing Approach

**Test Categories:**
1. **Utility Functions**: Time calculations, formatting functions
2. **Component Logic**: State updates, prop handling
3. **AsyncStorage Operations**: Data persistence and retrieval
4. **Error Handling**: Graceful failure scenarios

**Key Test Cases:**

**Time Calculations:**
```javascript
describe('calculateHours', () => {
  test('calculates correct hours for same day', () => {
    const start = '2024-01-01T09:00:00.000Z';
    const end = '2024-01-01T17:30:00.000Z';
    expect(calculateHours(start, end)).toBe(8.5);
  });
  
  test('handles overnight sessions', () => {
    const start = '2024-01-01T23:00:00.000Z';
    const end = '2024-01-02T07:00:00.000Z';
    expect(calculateHours(start, end)).toBe(8);
  });
});
```

**AsyncStorage Operations:**
```javascript
describe('AsyncStorage operations', () => {
  test('saves and retrieves clock state', async () => {
    const mockState = { isClocked: true, clockInTime: '2024-01-01T09:00:00.000Z' };
    await saveCurrentState(mockState);
    const retrieved = await loadStoredData();
    expect(retrieved.clockState).toEqual(mockState);
  });
});
```

### Integration Testing

**User Flow Testing:**
1. **Complete Work Session**: Clock in → Clock out → Verify session saved
2. **App Restart**: Clock in → Close app → Reopen → Verify state restored
3. **Multiple Sessions**: Complete several sessions → Verify history accuracy

### Manual Testing Checklist

**Core Functionality:**
- [ ] Clock in creates timestamp and updates UI
- [ ] Clock out calculates hours and saves session
- [ ] App restart preserves clock-in state
- [ ] Session history displays correctly
- [ ] Error states handled gracefully

**UI/UX Testing:**
- [ ] Buttons provide clear visual feedback
- [ ] Status messages are clear and accurate
- [ ] Session list is readable and well-formatted
- [ ] App works smoothly on iOS devices via Expo Go

### Performance Considerations

**AsyncStorage Optimization:**
- Batch operations when possible
- Limit session history to reasonable number (e.g., last 100 sessions)
- Use efficient data structures for quick lookups

**Memory Management:**
- Avoid storing large objects in component state
- Clean up timers and listeners properly
- Optimize re-renders with React.memo where beneficial

**User Experience:**
- Show loading states during AsyncStorage operations
- Provide immediate feedback for user actions
- Handle slow storage operations gracefully