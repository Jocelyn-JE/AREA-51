# AREA-51 Mobile Client

A Flutter application for the AREA-51 project that allows users to create and manage automated workflows between different services.

## Prerequisites

Before you begin, make sure you have the following installed on your system:
- Git
- A code editor (VS Code recommended)
- For Android: Android Studio or Android SDK
- For iOS: Xcode (macOS only)

## Step-by-Step Installation Guide

### Step 1: Install Flutter

#### On Windows:
1. Download the Flutter SDK from [flutter.dev](https://docs.flutter.dev/get-started/install/windows)
2. Extract the zip file to a location like `C:\flutter`
3. Add Flutter to your PATH:
   - Open "Environment Variables" in System Properties
   - Add `C:\flutter\bin` to your PATH variable
4. Restart your command prompt/terminal

#### On macOS:
1. Download the Flutter SDK from [flutter.dev](https://docs.flutter.dev/get-started/install/macos)
2. Extract the zip file to your home directory: `~/flutter`
3. Add Flutter to your PATH by adding this line to your shell profile (`.zshrc`, `.bash_profile`, etc.):
   ```bash
   export PATH="$PATH:$HOME/flutter/bin"
   ```
4. Reload your shell: `source ~/.zshrc`

#### On Linux:
1. Download the Flutter SDK from [flutter.dev](https://docs.flutter.dev/get-started/install/linux)
2. Follow the instructions on the official page to extract the SDK and add Flutter to your PATH.
3. Reload your shell: `source ~/.zshrc`

### Step 2: Verify Flutter Installation

Run the following command to check if Flutter is properly installed:
```bash
flutter doctor
```

This will show you what dependencies you still need to install.

### Step 3: Set Up Development Environment

#### For Android Development:
1. Install Android Studio from [developer.android.com](https://developer.android.com/studio)
2. Open Android Studio and install the Android SDK
3. Create an Android Virtual Device (AVD) or connect a physical Android device
4. Enable Developer Options and USB Debugging on your device:
   - Go to Settings > About phone
   - Tap "Build number" 7 times
   - Go back to Settings > Developer options
   - Enable "USB debugging"

#### For iOS Development (macOS only):
1. Install Xcode from the Mac App Store
2. Install Xcode Command Line Tools:
   ```bash
   sudo xcode-select --install
   ```
3. Accept Xcode license:
   ```bash
   sudo xcodebuild -license accept
   ```
4. Set up iOS Simulator or connect a physical iOS device

### Step 4: Clone and Set Up the Project

1. Clone the repository:
   ```bash
   git clone https://github.com/Jocelyn-JE/AREA-51
   cd AREA-51/mobile_client
   ```

2. Get Flutter dependencies:
   ```bash
   flutter pub get
   ```

3. Verify everything is set up correctly:
   ```bash
   flutter doctor
   ```

### Step 5: Compile and Run on Device

#### For Android:

1. **Connect your Android device** via USB or start an Android emulator

2. **Verify device connection:**
   ```bash
   flutter devices
   ```

3. **Run in debug mode:**
   ```bash
   flutter run
   ```

4. **Build APK for release:**
   ```bash
   flutter build apk --release
   ```
   The APK will be located at: `build/app/outputs/flutter-apk/app-release.apk`

5. **Install APK on device:**
   ```bash
   flutter install
   ```

#### For iOS (macOS only):

1. **Open iOS Simulator** or connect your iOS device

2. **Verify device connection:**
   ```bash
   flutter devices
   ```

3. **Run in debug mode:**
   ```bash
   flutter run
   ```

4. **Build for iOS device:**
   ```bash
   flutter build ios --release
   ```

5. **Deploy to device using Xcode:**
   - Open `ios/Runner.xcworkspace` in Xcode
   - Select your device
   - Click the "Run" button

### Step 6: Development Commands

- **Hot reload** (while app is running): Press `r`
- **Hot restart** (while app is running): Press `R`
- **Run tests:**
  ```bash
  flutter test
  ```
- **Format code:**
  ```bash
  flutter format .
  ```
- **Analyze code:**
  ```bash
  flutter analyze
  ```

## Troubleshooting

### Common Issues:

1. **"flutter: command not found"**
   - Make sure Flutter is added to your PATH
   - Restart your terminal/command prompt

2. **Android license issues**
   - Run: `flutter doctor --android-licenses`
   - Accept all licenses

3. **iOS build issues**
   - Make sure Xcode is up to date
   - Run: `sudo xcode-select --install`

4. **Gradle build errors**
   - Clean the build: `flutter clean`
   - Get dependencies: `flutter pub get`
   - Try building again

5. **Device not detected**
   - Check USB debugging is enabled (Android)
   - Try different USB cable
   - Restart adb: `adb kill-server && adb start-server`

## Additional Resources

- [Flutter Documentation](https://docs.flutter.dev/)
- [Dart Language Tour](https://dart.dev/guides/language/language-tour)
- [Flutter Cookbook](https://docs.flutter.dev/cookbook)
- [Flutter Widget Catalog](https://docs.flutter.dev/development/ui/widgets)
