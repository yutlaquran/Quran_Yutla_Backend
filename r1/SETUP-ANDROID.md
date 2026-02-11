# Android Studio Setup Guide

## Installation Steps

1. **Download Android Studio**
   - Visit: https://developer.android.com/studio
   - Download and install Android Studio

2. **Install Android SDK**
   - Open Android Studio
   - Go to: Tools → SDK Manager
   - Install:
     - Android SDK Platform 33 or 34
     - Android SDK Build-Tools
     - Android Emulator
     - Android SDK Platform-Tools

3. **Create Virtual Device**
   - Go to: Tools → Device Manager
   - Click "Create Device"
   - Select: Pixel 5 or any device
   - Select System Image: Android 13 (Tiramisu) or 14
   - Finish setup

4. **Set Environment Variables**

   Open PowerShell as Administrator and run:
   ```powershell
   [Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LOCALAPPDATA\Android\Sdk", "User")
   [Environment]::SetEnvironmentVariable("Path", "$env:Path;$env:LOCALAPPDATA\Android\Sdk\platform-tools", "User")
   ```

5. **Restart VS Code** after setting environment variables

6. **Start Emulator**
   - Open Android Studio → Device Manager
   - Click Play button on your virtual device

7. **Run App**
   ```bash
   cd r1
   npx expo start
   # Press 'a' when emulator is running
   ```

## Quick Test

After setup, test if ADB is working:
```bash
adb devices
```

You should see your emulator listed.
