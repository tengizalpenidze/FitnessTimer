# Just HIIT - Setup Instructions for Mac

Great news! You have all the files ready. Here's how to get your iOS app running:

## Step 1: Install Dependencies
In your terminal, run these commands:

```bash
cd mobile-app/JustHIIT
npm install
```

This will install all the required Expo and React Native packages including:
- expo-av (audio)
- expo-haptics (vibrations) 
- expo-keep-awake (screen on)
- expo-linear-gradient (UI)
- AsyncStorage (settings)

## Step 2: Start the App
After installation completes, run:

```bash
npx expo start --ios
```

This will:
- Start the Expo development server
- Open iOS Simulator automatically
- Load your Just HIIT app

## Step 3: Test Features
Your app now includes:
- ✅ Full HIIT timer functionality
- ✅ Native haptic feedback on iOS
- ✅ Settings persistence 
- ✅ Screen keeps awake during workouts
- ✅ Beautiful gradients and animations
- ✅ Voice announcements (via alerts for now)

## Optional: Add Real Audio
To add actual beep sounds:
1. Find a short beep.mp3 file
2. Replace `/assets/beep.mp3` with your audio file
3. The app will automatically use it

## What You'll See
- Dark themed iOS app with "Just HIIT" branding
- Large circular timer display
- Workout/rest phase indicators
- Haptic feedback on timer beeps
- Settings showing 40s work / 20s rest
- Smooth gradient backgrounds

The app works exactly like the web version but with native iOS features like haptic feedback and better performance.

## Troubleshooting
If you get any errors:
1. Make sure you're in the `mobile-app/JustHIIT` folder
2. Run `npm install` first
3. Ensure Xcode is installed from Mac App Store
4. Try `npx expo start --clear` to clear cache

Your Just HIIT app is now a fully functional native iOS application!