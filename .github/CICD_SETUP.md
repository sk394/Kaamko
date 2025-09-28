# GitHub Actions CI/CD Setup Guide

This guide explains how to set up the GitHub Actions CI/CD pipeline for the Kaamko App.

## 🔐 Required Secrets

You need to configure the following secrets in your GitHub repository:

### Navigate to: Settings → Secrets and Variables → Actions → Repository Secrets

### Required Secrets:

#### 1. `EXPO_TOKEN` (Required)
- **Description**: Expo authentication token for building and publishing
- **How to get**: 
  1. Install Expo CLI: `npm install -g @expo/eas-cli`
  2. Login: `expo login`
  3. Generate token: `expo whoami` then visit https://expo.dev/settings/access-tokens
- **Value**: Your Expo access token

#### 2. `EXPO_APPLE_ID` (Required for iOS submission)
- **Description**: Your Apple ID email for App Store Connect
- **Value**: Your Apple developer account email (e.g., `your.email@example.com`)

#### 3. `EXPO_APPLE_APP_SPECIFIC_PASSWORD` (Required for iOS submission)
- **Description**: App-specific password for your Apple ID
- **How to get**:
  1. Go to https://appleid.apple.com/
  2. Sign in with your Apple ID
  3. Go to "Security" section
  4. Generate an app-specific password
- **Value**: The generated app-specific password

### Optional Secrets (for enhanced features):

#### 4. `SONAR_TOKEN` (Optional - Code Quality)
- **Description**: SonarCloud token for code quality analysis
- **How to get**: Sign up at https://sonarcloud.io/ and create a token
- **Value**: Your SonarCloud token

#### 5. `CC_TEST_REPORTER_ID` (Optional - Code Coverage)
- **Description**: CodeClimate test reporter ID
- **How to get**: Sign up at https://codeclimate.com/ and get your test reporter ID
- **Value**: Your CodeClimate test reporter ID

## 🚀 Workflows Overview

### 1. **Main CI/CD Pipeline** (`ci-cd.yml`)
- **Triggers**: Push to main/develop, Pull Requests, Releases
- **Features**:
  - Runs tests and linting
  - Security audit
  - Builds preview for develop branch
  - Builds production for main branch
  - Auto-submits to app stores on releases
  - Deploys to Expo for OTA updates

### 2. **Manual Deployment** (`manual-deploy.yml`)
- **Triggers**: Manual workflow dispatch
- **Features**:
  - Choose platform (iOS, Android, or both)
  - Choose build profile (development, preview, production)
  - Option to bump version automatically
  - Option to submit to app stores
  - Flexible deployment control

### 3. **Quality Checks** (`quality-checks.yml`)
- **Triggers**: All pushes and PRs
- **Features**:
  - Multi-Node.js version testing
  - ESLint, Prettier, TypeScript checks
  - Security vulnerability scanning
  - Code quality analysis
  - Bundle size monitoring

### 4. **EAS Build and Submit** (`eas-build-submit.yml`)
- **Triggers**: Called by other workflows
- **Features**:
  - Reusable workflow for building and submitting
  - Support for all platforms and profiles
  - Automatic PR commenting with build info
  - App store submission handling

## 📋 Setup Checklist

### Prerequisites:
- [ ] Node.js 20.x or higher installed locally
- [ ] Expo account created
- [ ] EAS CLI installed locally: `npm install -g @expo/eas-cli`
- [ ] Project configured for EAS: `eas build:configure`
- [ ] Apple Developer account (for iOS)
- [ ] Google Play Developer account (for Android)

**Note**: The global `expo-cli` has been deprecated. Use `npx expo` for Expo CLI commands and `eas` for builds/submissions.

### GitHub Repository Setup:
- [ ] Add all required secrets (at minimum `EXPO_TOKEN`)
- [ ] Enable GitHub Actions in repository settings
- [ ] Set up branch protection rules for `main` branch
- [ ] Configure auto-merge for dependabot PRs (optional)

### EAS Configuration:
- [ ] Configure `eas.json` with build profiles
- [ ] Set up credentials: `eas credentials`
- [ ] Test build locally: `eas build --platform all --profile preview`

### App Store Setup:
- [ ] iOS: Set up app in App Store Connect
- [ ] Android: Set up app in Google Play Console
- [ ] Configure app store metadata, screenshots, etc.

## 🔧 Build Profiles in `eas.json`

Make sure your `eas.json` includes these profiles:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "autoIncrement": true,
      "ios": {
        "buildConfiguration": "Release"
      },
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

## 🚦 Deployment Workflow

### Automatic Deployments:

1. **Development/Feature Work**:
   - Push to feature branches → Quality checks run
   - Open PR to `develop` → Quality checks + preview build
   - Merge to `develop` → Preview build created

2. **Production Release**:
   - Merge `develop` to `main` → Production build created + Expo OTA update
   - Create release on GitHub → Production build + auto-submit to app stores

### Manual Deployments:

1. Go to **Actions** tab in GitHub
2. Select **Manual Deployment** workflow
3. Click **Run workflow**
4. Choose your options:
   - Platform (iOS, Android, or both)
   - Profile (development, preview, production)
   - Version bump (optional)
   - Submit to stores (optional)
5. Click **Run workflow**

## 📊 Monitoring and Notifications

### Build Status:
- Check the **Actions** tab for workflow status
- Build summaries are automatically generated
- PR comments include build information

### App Store Status:
- iOS: Check App Store Connect for submission status
- Android: Check Google Play Console for submission status

### Expo Dashboard:
- Visit https://expo.dev/accounts/[your-account]/projects/kaamko-app
- Monitor builds, submissions, and OTA updates

## 🔍 Troubleshooting

### Common Issues:

1. **Build Fails with "EXPO_TOKEN not found"**:
   - Make sure you've added the `EXPO_TOKEN` secret in GitHub repository settings

2. **iOS Submission Fails**:
   - Verify `EXPO_APPLE_ID` and `EXPO_APPLE_APP_SPECIFIC_PASSWORD` are set
   - Check that your Apple Developer account has necessary permissions

3. **Android Build Fails**:
   - Ensure your `eas.json` is properly configured
   - Check EAS credentials: `eas credentials`

4. **Tests Fail**:
   - Run tests locally: `npm test`
   - Check for missing dependencies or configuration issues

### Getting Help:
- Check workflow logs in the Actions tab
- Review EAS build logs in Expo dashboard
- Consult Expo documentation: https://docs.expo.dev/

## 🎯 Best Practices

1. **Branch Strategy**:
   - Use feature branches for development
   - Merge to `develop` for testing
   - Merge to `main` for production releases

2. **Version Management**:
   - Use semantic versioning (major.minor.patch)
   - Increment versions for app store releases
   - Use build numbers for internal builds

3. **Testing**:
   - Write comprehensive tests
   - Test on multiple devices/simulators
   - Use preview builds for stakeholder review

4. **Security**:
   - Keep secrets secure and rotate regularly
   - Review dependencies for vulnerabilities
   - Monitor build logs for sensitive information

## 📱 App Store Submission Process

### iOS App Store:
1. Build completes → Uploaded to App Store Connect
2. Review build in TestFlight
3. Submit for App Store review
4. Monitor review status
5. Release when approved

### Google Play Store:
1. Build completes → Uploaded to Google Play Console
2. Review app bundle in Internal Testing
3. Promote to Production or submit for review
4. Monitor review status
5. Release when approved

---

## 🤝 Contributing to CI/CD

When modifying workflows:
1. Test changes in a feature branch first
2. Use workflow dispatch for testing
3. Monitor build times and optimize if needed
4. Update this documentation for any changes
5. Consider backward compatibility

---

**Need Help?** Create an issue in the repository with the `ci-cd` label for assistance with deployment setup or troubleshooting.