# Manual Deployment Instructions for iOS (TestFlight)

This document provides step-by-step instructions for running the manual deployment workflow to build a production-ready iOS app for TestFlight.

## Prerequisites

Before triggering the manual deployment, ensure you have the following secrets configured in your GitHub repository:

### Required Secrets
1. **EXPO_TOKEN** - Your Expo access token for EAS builds
2. **EXPO_APPLE_ID** - Your Apple ID for App Store Connect
3. **EXPO_APPLE_APP_SPECIFIC_PASSWORD** - App-specific password for your Apple ID
4. **EXPO_ASC_APP_ID** - (Optional) Your App Store Connect app ID
5. **EXPO_APPLE_TEAM_ID** - (Optional) Your Apple Developer Team ID

## Quick TestFlight Deployment

### Option 1: TestFlight-Only Build (Recommended for Quick Deployment)
1. Go to the **Actions** tab in your GitHub repository
2. Select **Manual Deployment** workflow
3. Click **Run workflow**
4. Configure the following options:
   - **Platform**: `ios`
   - **Build profile**: `preview` (recommended for TestFlight)
   - **Submit to app stores**: `false` (you can submit manually later)
   - **Bump version**: `false` (unless you need version increment)
   - **TestFlight only**: `true` (this will optimize for TestFlight deployment)

### Option 2: Production Build with Automatic Submission
1. Go to the **Actions** tab in your GitHub repository
2. Select **Manual Deployment** workflow
3. Click **Run workflow**
4. Configure the following options:
   - **Platform**: `ios`
   - **Build profile**: `production`
   - **Submit to app stores**: `true`
   - **Bump version**: `true` (if you want to increment version)
   - **TestFlight only**: `false`

## Build Process

The workflow will:
1. ✅ Set up Node.js 20.x environment
2. ✅ Install dependencies
3. ⚠️ Run tests (failures will not block the build as requested)
4. 🔨 Build the iOS app using EAS Build
5. 📱 Submit to TestFlight/App Store (if enabled)
6. 📊 Provide a deployment summary

## After the Build

### If using TestFlight option:
- The app will be built with preview profile optimized for TestFlight
- Check the workflow run for the build URL and download link
- The build will be available in your Expo dashboard
- You can manually submit to TestFlight from Expo or App Store Connect

### If using production with submission:
- The app will be automatically submitted to App Store Connect
- Check TestFlight for the new build (may take a few minutes to process)
- You can distribute to testers directly from TestFlight

## Current App Configuration

- **App Name**: Kaamko App
- **Bundle ID**: com.iamsumankd.kaamkoapp
- **Version**: 1.0.0
- **Supports iPad**: Yes
- **Icon**: time.png

## Troubleshooting

### Common Issues:
1. **Missing secrets**: Ensure all required secrets are configured in repository settings
2. **Apple ID issues**: Verify your Apple ID and app-specific password are correct
3. **Build failures**: Check the workflow logs for specific error messages
4. **Test failures**: Tests may fail but won't block the build process

### Getting Help:
- Check the GitHub Actions logs for detailed error messages
- Verify your Expo account has necessary permissions
- Ensure your Apple Developer account is in good standing

## Next Steps

After a successful build:
1. Test the app on TestFlight
2. Gather feedback from testers
3. Iterate and deploy updates as needed
4. Submit to App Store when ready for public release

---

**Note**: The workflow is optimized to continue even if tests fail, allowing you to get builds quickly as requested.