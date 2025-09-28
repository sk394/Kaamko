# Node.js Version Requirements

The Kaamko app and its CI/CD pipeline require **Node.js 20.x or higher** due to dependency requirements.

## Current Issue
The error `minimatch@10.0.3: The engine "node" is incompatible with this module. Expected version "20 || >=22". Got "18.20.8"` indicates that your current Node.js version (18.20.8) is too old for some dependencies.

## Solutions

### Option 1: Update Node.js Globally
```bash
# Using Node Version Manager (nvm) - Recommended
# Install nvm first if you haven't: https://github.com/nvm-sh/nvm

# Install and use Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

# Verify the version
node --version  # Should show v20.x.x

# Install modern EAS CLI (replaces deprecated expo-cli)
npm install -g @expo/eas-cli
```

### Important: CLI Migration
The global `expo-cli` has been deprecated. Use these modern commands:
- **Old**: `expo build` → **New**: `eas build`
- **Old**: `expo publish` → **New**: `eas update`
- **Old**: `expo start` → **New**: `npx expo start`

### Option 2: Use .nvmrc file (Already created for you)
```bash
# Create .nvmrc file in project root with Node 20
echo "20" > .nvmrc

# Then use it
nvm use
```

### Option 3: Update using Node.js installer
1. Go to https://nodejs.org/
2. Download Node.js 20.x LTS
3. Install it (this will replace your current version)

### Option 4: Use Volta (Alternative to nvm)
```bash
# Install Volta first: https://volta.sh/
curl https://get.volta.sh | bash

# Install and pin Node 20 for this project
volta install node@20
volta pin node@20
```

## For Windows Users (PowerShell)
```powershell
# Using Chocolatey
choco install nodejs --version=20.0.0

# Or using Scoop
scoop install nodejs-lts

# Using nvm-windows
nvm install 20.0.0
nvm use 20.0.0
```

## After Updating Node.js

1. **Clear npm cache and reinstall dependencies:**
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Verify everything works:**
   ```bash
   npm run lint
   npm test
   npx expo --version
   ```

## CI/CD Pipeline Updates Made

I've updated all the GitHub Actions workflows to use Node.js 20.x:

- ✅ `ci-cd.yml` - Updated to Node 20.x
- ✅ `manual-deploy.yml` - Updated to Node 20.x  
- ✅ `quality-checks.yml` - Updated to Node 20.x, testing on 18.x, 20.x, 22.x
- ✅ `eas-build-submit.yml` - Updated to Node 20.x
- ✅ `dependency-updates.yml` - Updated to Node 20.x

## Package.json Engine Requirement

You may also want to add engine requirements to your package.json:

```json
{
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=9.0.0"
  }
}
```

This will warn users if they're using an incompatible Node.js version.

## Troubleshooting

### If you can't update Node.js right now:
1. **Force install with legacy peer deps** (temporary fix):
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Use specific package versions** that support Node 18:
   ```bash
   npm install minimatch@9.0.3 --save-dev
   ```

### If CI/CD fails:
- Check the Node.js version in the workflow logs
- Ensure all secrets are properly configured
- Verify EAS CLI is compatible with Node 20

---

**Recommendation**: Update to Node.js 20.x locally for the best development experience and compatibility with all modern packages.