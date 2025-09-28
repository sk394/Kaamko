# Kaamko App - Deployment Guide

**Work Smarter, Track Better**

## App Store Information

### App Name
Kaamko App

### Slogan/Tagline
Work Smarter, Track Better

### Short Description
A simple and elegant time tracking application for professionals and freelancers.

### Long Description
Kaamko App helps you track your work time effortlessly with intuitive clock-in/clock-out functionality. Perfect for freelancers, consultants, and professionals who need to monitor their productivity and billable hours.

**Key Features:**
- ⏰ Simple one-tap clock-in/clock-out
- 📊 Comprehensive session history
- 🎨 Beautiful, modern interface
- 💾 Automatic data persistence
- 📱 Optimized for all screen sizes
- 🚫 No internet required - fully offline

**Why Choose Kaamko?**
- Clean, distraction-free interface
- Fast and reliable performance
- Your data stays private on your device
- No subscriptions or hidden fees
- Perfect for tracking billable hours

### Keywords
time tracker, work timer, productivity, freelance, billing, hours tracking, time management, work sessions, clock in out, timesheet

### Category
- Primary: Productivity
- Secondary: Business

## App Icon & Screenshots
- App Icon: `./assets/time.png`
- Splash Screen: `./assets/time.png`

## Build Commands

### Development Build
```bash
npx expo install
npx expo start
```

### Production Build (EAS)
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Configure EAS (first time only)
eas build:configure

# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production

# Build for both platforms
eas build --platform all --profile production
```

### Submit to App Stores
```bash
# Submit to iOS App Store
eas submit --platform ios

# Submit to Google Play Store
eas submit --platform android

# Submit to both stores
eas submit --platform all
```

## Pre-deployment Checklist

### App Configuration
- [x] App name updated to "Kaamko App"
- [x] Bundle identifier updated (iOS: com.iamsumankd.kaamkoapp)
- [x] Package name updated (Android: com.iamsumankd.kaamkoapp)
- [x] App icon set to time.png
- [x] Splash screen configured
- [x] Version number set to 1.0.0
- [x] Description and metadata added

### Testing
- [ ] Test on iOS device/simulator
- [ ] Test on Android device/emulator
- [ ] Test clock-in/clock-out functionality
- [ ] Test session history
- [ ] Test data persistence
- [ ] Test app on different screen sizes
- [ ] Test offline functionality

### App Store Requirements
- [ ] Create App Store Connect listing (iOS)
- [ ] Create Google Play Console listing (Android)
- [ ] Prepare app screenshots
- [ ] Write app store description
- [ ] Set up app categories and keywords
- [ ] Configure pricing (Free)
- [ ] Add privacy policy if required

### Screenshots Needed
1. Main clock screen (not clocked in)
2. Clock screen when clocked in with analog clock
3. Session history screen
4. Settings screen
5. App in tablet/landscape mode (if supported)

## App Store Listings

### Apple App Store
- **Title**: Kaamko App
- **Subtitle**: Work Smarter, Track Better
- **Category**: Productivity
- **Age Rating**: 4+ (No Objectionable Content)
- **Pricing**: Free

### Google Play Store
- **Title**: Kaamko App
- **Short Description**: Work Smarter, Track Better - Simple time tracking for professionals
- **Category**: Productivity
- **Content Rating**: Everyone
- **Pricing**: Free

## Privacy Policy
Since the app stores all data locally and doesn't collect any personal information or send data to external servers, a minimal privacy policy may still be required for app store compliance.

## Support Information
- **Developer**: Suman Khadka
- **Email**: [Your Support Email]
- **Website**: [Your Website]
- **GitHub**: https://github.com/sk394/Kaamko

## Version History
- **v1.0.0**: Initial release
  - Clock-in/clock-out functionality
  - Session history tracking
  - Local data storage
  - Modern UI with Material Design
  - Cross-platform support (iOS, Android)