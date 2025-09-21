# Quick Manual Testing Checklist

## Essential Tests (15-20 minutes)

### ✅ Basic Functionality
- [ ] App loads successfully on iOS device via Expo Go
- [ ] Initial state shows "Not Clocked In" and "Clock In" button
- [ ] Clock in works - status changes to "Clocked In at [time]"
- [ ] Clock out works - status returns to "Not Clocked In"
- [ ] Session appears in history with correct time and hours
- [ ] Success notifications appear for both actions

### ✅ Data Persistence
- [ ] Close and reopen app - state is preserved
- [ ] Clock in, close app, reopen - still clocked in
- [ ] Session history persists after app restart
- [ ] Background/foreground maintains state

### ✅ User Interface
- [ ] All text is readable and properly formatted
- [ ] Buttons respond to touch with visual feedback
- [ ] Loading states appear during operations
- [ ] Notifications can be dismissed
- [ ] Scrolling works smoothly in session history

### ✅ Error Handling
- [ ] App handles network interruptions gracefully
- [ ] Error notifications appear when appropriate
- [ ] App continues functioning after errors

## Extended Tests (30-45 minutes)

### ✅ Multiple Sessions
- [ ] Create 3-5 sessions and verify all appear correctly
- [ ] Sessions are ordered most recent first
- [ ] Hours calculations are accurate
- [ ] Different session lengths work correctly

### ✅ Edge Cases
- [ ] Very short sessions (under 1 minute)
- [ ] Rapid clock in/out operations
- [ ] Clock in/out across minute boundaries
- [ ] Extended app usage without issues

### ✅ Performance
- [ ] App launches within reasonable time
- [ ] Interactions are responsive
- [ ] No crashes or freezing during normal use
- [ ] Memory usage appears stable

## Critical Issues to Watch For

### 🚨 Blockers
- App crashes on launch
- Cannot clock in or clock out
- Data loss after app restart
- UI completely broken or unreadable

### ⚠️ High Priority
- Incorrect time calculations
- Missing session history
- Notifications not appearing
- Buttons not responding

### 📝 Medium Priority
- Minor UI alignment issues
- Slow performance
- Unclear error messages
- Accessibility concerns

## Device Testing Matrix

Test on multiple devices if available:
- [ ] iPhone (latest iOS)
- [ ] iPhone (older iOS version)
- [ ] iPad (if supported)
- [ ] Different screen sizes

## Sign-off Criteria

Manual testing is complete when:
- [ ] All essential tests pass
- [ ] No critical or high-priority issues found
- [ ] App provides good user experience
- [ ] Data persistence works reliably
- [ ] Performance is acceptable

**Tester:** ________________  
**Date:** ________________  
**iOS Version:** ________________  
**Device Model:** ________________  
**Overall Status:** ✅ Pass / ❌ Fail  

**Notes:**
_________________________________
_________________________________
_________________________________