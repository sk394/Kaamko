# Kaamko App

**Work Smarter, Track Better**

A simple and elegant time tracking application built with React Native and Expo. Track your work sessions with clock-in/clock-out functionality and maintain a history of all your work sessions.

## Features

- **Simple Time Tracking**: Easy clock-in and clock-out with one-tap buttons
- **Session History**: View all your past work sessions with detailed information
- **Data Persistence**: All data is stored locally using AsyncStorage
- **Clean UI**: Built with React Native Paper for a modern, Material Design interface
- **Error Handling**: Robust error handling with user-friendly messages
- **Performance Optimized**: Memoized components and efficient data operations

## Screenshots

The app features a clean, single-screen interface with:
- Current status display (clocked in/out)
- Large, clear action buttons
- Session history with date, times, and hours worked
- Loading states and error notifications

## Prerequisites

Before running this app, make sure you have:

- [Node.js](https://nodejs.org/) (version 16 or higher)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Expo Go](https://expo.dev/client) app on your iOS/Android device
- A code editor (VS Code recommended)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kaamko-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on your device**
   - Scan the QR code with Expo Go (Android) or Camera app (iOS)
   - The app will load on your device

## Usage

### Basic Time Tracking

1. **Clock In**: Tap the "Clock In" button to start tracking time
   - The app will record the current timestamp
   - Status will update to show "Clocked In at [time]"

2. **Clock Out**: Tap the "Clock Out" button to stop tracking
   - The app will calculate hours worked
   - A new session will be saved to your history

### Session History

- View all past work sessions in the history section
- Each session shows:
  - Date of the session
  - Clock-in and clock-out times
  - Total hours worked (rounded to 2 decimal places)
- Sessions are ordered with most recent first

### Data Persistence

- All data is automatically saved to your device
- App state persists across app restarts
- If you're clocked in and close the app, you'll remain clocked in when you reopen it

## Project Structure

```
kaamko-app/
├── App.tsx                 # Main app component
├── src/
│   ├── components/         # React components
│   │   ├── ClockControls.tsx
│   │   ├── SessionHistory.tsx
│   │   ├── StatusDisplay.tsx
│   │   └── ErrorBoundary.tsx
│   ├── utils/              # Utility functions
│   │   ├── storage.ts      # AsyncStorage operations
│   │   ├── timeUtils.ts    # Time calculation functions
│   │   ├── validation.ts   # Data validation
│   │   ├── errorHandling.ts # Error handling utilities
│   │   └── performance.ts  # Performance monitoring
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts
│   ├── theme/              # App theming
│   │   └── colors.ts
│   └── __tests__/          # Test files
├── assets/                 # App icons and images
└── package.json
```

## Architecture

The app follows a simple, functional architecture:

- **Single Screen Design**: All functionality on one screen for simplicity
- **Local State Management**: Uses React hooks for state management
- **AsyncStorage**: Local data persistence without backend dependency
- **Component-Based**: Modular components for maintainability
- **Error Boundaries**: Graceful error handling and recovery

## Key Components

### App.tsx
Main application component that manages global state and coordinates between child components.

### StatusDisplay
Shows current clock status and clock-in time when applicable.

### ClockControls
Renders Clock In/Clock Out buttons with loading states and visual feedback.

### SessionHistory
Displays list of past work sessions with formatted data.

## Data Models

### Session Object
```typescript
{
  id: string,           // Unique identifier
  date: string,         // Format: "YYYY-MM-DD"
  clockIn: string,      // ISO 8601 timestamp
  clockOut: string,     // ISO 8601 timestamp
  hours: number         // Calculated hours (decimal)
}
```

### Clock State
```typescript
{
  isClocked: boolean,
  clockInTime: string | null  // ISO 8601 timestamp
}
```

## Performance Optimizations

- **React.memo**: Components are memoized to prevent unnecessary re-renders
- **useCallback**: Event handlers are memoized for performance
- **FlatList Optimization**: Efficient rendering of session history
- **Session Limiting**: History limited to 50 sessions for performance
- **Batch Operations**: AsyncStorage operations are batched when possible

## Testing

Run the test suite:

```bash
npm test
```

The app includes:
- Unit tests for utility functions
- Component tests for UI behavior
- Integration tests for complete workflows
- Manual testing guides

## Error Handling

The app includes comprehensive error handling:

- **AsyncStorage Failures**: App continues with in-memory state
- **Data Corruption**: Automatic recovery with clean state
- **Network Issues**: Not applicable (fully offline app)
- **User Feedback**: Clear error messages and notifications

## Known Limitations

1. **Local Storage Only**: Data is not synced across devices
2. **No Export Feature**: Sessions cannot be exported to external formats
3. **Basic Reporting**: No advanced analytics or reporting features
4. **Single User**: No multi-user support
5. **Session Limit**: History limited to 50 sessions for performance

## Future Enhancements

Potential improvements for future versions:

- **Data Export**: Export sessions to CSV or PDF
- **Cloud Sync**: Backup data to cloud storage
- **Advanced Reporting**: Weekly/monthly summaries and charts
- **Project Tracking**: Assign sessions to different projects
- **Notifications**: Reminders to clock in/out
- **Dark Mode**: Theme switching support

## Troubleshooting

### App Won't Start
- Ensure Node.js and Expo CLI are installed
- Try clearing npm cache: `npm cache clean --force`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`

### Data Not Persisting
- Check device storage space
- Try restarting the app
- Clear app data and start fresh if needed

### Performance Issues
- Restart the app if it becomes sluggish
- Clear session history if it becomes too large
- Ensure device has sufficient memory

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Commit your changes: `git commit -am 'Add feature'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support or questions:
- Create an issue in the repository
- Check the troubleshooting section above
- Review the Expo documentation for platform-specific issues

---

Built with ❤️ using React Native and Expo