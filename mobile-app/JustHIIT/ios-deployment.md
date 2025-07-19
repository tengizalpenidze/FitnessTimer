# Just HIIT - iOS App Deployment Guide

## Overview
Your Just HIIT timer has been successfully converted into a native iOS app using React Native and Expo. This guide covers development, testing, and App Store deployment.

## Features Converted to Native iOS
- ✅ **Complete HIIT Timer** - All workout/rest/set logic preserved
- ✅ **Native Audio** - Beeps and voice announcements using Expo AV
- ✅ **Haptic Feedback** - iOS-native vibrations for enhanced UX
- ✅ **Background Keep Awake** - Screen stays on during workouts
- ✅ **Settings Persistence** - AsyncStorage for offline settings
- ✅ **Native UI** - Beautiful gradients and animations
- ✅ **Dark Theme** - Optimized for iOS dark mode

## Development Setup

### Prerequisites
- **macOS required** for iOS development and testing
- **Xcode** (latest version from Mac App Store)
- **Node.js** 18+ installed
- **Expo CLI** (`npm install -g @expo/cli`)

### Local Development
```bash
# Navigate to the mobile app
cd mobile-app/JustHIIT

# Install dependencies
npm install

# Start development server
npx expo start

# Test on iOS Simulator
npx expo start --ios

# Test on physical iOS device
# Scan QR code with Expo Go app or Camera app
```

## iOS Simulator Testing

### Quick Start
1. **Install Xcode** from Mac App Store
2. **Open Simulator**: Xcode → Open Developer Tool → Simulator
3. **Run app**: `npx expo start --ios` in project directory
4. **Test features**: Timer, audio, haptics, settings

### Testing Checklist
- [ ] Timer starts and counts down correctly
- [ ] Audio beeps play at 3, 2, 1 seconds
- [ ] Voice announcements work ("Start", "Rest", etc.)
- [ ] Haptic feedback feels natural
- [ ] Settings save and persist
- [ ] Background keep-awake prevents screen sleep
- [ ] App works in portrait orientation
- [ ] Dark theme displays correctly

## Building for iOS

### Development Build (Recommended for Testing)
```bash
# Configure EAS Build
npx eas build:configure

# Create development build for iOS Simulator
npx eas build --platform ios --profile development

# Install on simulator after build completes
npx eas build:run -p ios --latest
```

### Production Build (App Store Ready)
```bash
# Build for App Store submission
npx eas build --platform ios --profile production

# This creates an .ipa file ready for App Store Connect
```

## App Store Deployment

### Requirements
1. **Apple Developer Account** ($99/year)
   - Individual or Organization account
   - Required for App Store distribution

2. **App Store Connect Setup**
   - Create app bundle identifier: `com.justhiit.timer`
   - Upload app metadata, screenshots, descriptions

3. **Production Build**
   - Use `eas build --platform ios --profile production`
   - Upload .ipa file to App Store Connect

### App Store Listing Information
- **App Name**: "Just HIIT"
- **Category**: Health & Fitness
- **Keywords**: HIIT, timer, workout, fitness, interval training
- **Description**: "Mobile-first HIIT timer with audio cues and haptic feedback"

## Configuration Details

### App Bundle ID
- **iOS**: `com.justhiit.timer`
- **Display Name**: "Just HIIT"
- **Version**: 1.0.0

### Permissions & Capabilities
- **Audio**: Background audio for timer sounds
- **Vibration**: Haptic feedback for enhanced UX
- **Keep Awake**: Prevents screen sleep during workouts

### Audio Configuration
- Plays in silent mode (iOS)
- Background audio capability
- Haptic feedback integration
- Voice announcements using system TTS

## Native Features Added

### iOS-Specific Enhancements
1. **Haptic Feedback**
   - Impact feedback for beeps
   - Success notification for workout completion
   - Medium intensity vibrations

2. **Audio Background Mode**
   - Timer sounds continue when app is backgrounded
   - Configures iOS audio session for playback

3. **Keep Awake**
   - Screen stays on during active timer
   - Automatically deactivates when timer stops

4. **Native Storage**
   - AsyncStorage for settings persistence
   - Survives app restarts and updates

## Troubleshooting

### Common Issues
1. **Audio Not Working**
   - Check device volume and silent mode
   - iOS requires user interaction before playing audio
   - Test with physical device, not just simulator

2. **Build Errors**
   - Ensure Xcode Command Line Tools installed
   - Update to latest Expo SDK version
   - Check Apple Developer account status

3. **App Store Rejection**
   - Ensure all required metadata is complete
   - Test on multiple iOS device sizes
   - Follow Apple's Human Interface Guidelines

## Next Steps

### Immediate Actions
1. **Test on iOS Simulator** - Verify all features work
2. **Test on Physical Device** - Use Expo Go or development build
3. **Create App Store Connect** - Set up app listing
4. **Submit for Review** - Upload production build

### Future Enhancements
- Apple Watch companion app
- Siri Shortcuts integration
- Apple Health app integration
- Custom workout programs
- Social sharing features

## Technical Architecture

### React Native Components
- **Expo Router** for navigation (if adding screens)
- **Expo AV** for audio playback
- **Expo Haptics** for vibration feedback
- **AsyncStorage** for data persistence
- **LinearGradient** for beautiful UI

### Performance Optimizations
- Efficient timer implementation
- Memory-safe audio handling
- Optimized re-renders
- Native module integration

The app is now fully converted to React Native and ready for iOS development and App Store deployment!