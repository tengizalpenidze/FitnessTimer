# Just HIIT - HIIT Timer App

## Overview
A mobile-first HIIT timer application designed for intuitive workout tracking and management. The app provides a seamless mobile experience for high-intensity interval training with focus on user-friendly design and performance tracking. **Now fully converted to a frontend-only PWA that works offline.**

## Project Architecture
- **Frontend**: React with TypeScript for the UI components (pure client-side)
- **Styling**: Tailwind CSS with dark theme optimization
- **Audio**: Web Audio API for timer beeps and voice announcements
- **Storage**: Local storage for settings persistence (no server required)
- **Build**: Vite for development and static production builds
- **PWA**: Service worker for offline functionality and app-like experience
- **Deployment**: Static file hosting ready

## Recent Changes
- **2025-07-16**: Successfully converted to frontend-only application ✅
  - Removed server dependencies and created simplified UI components
  - Fixed build issues with Tailwind CSS and import resolution
  - Implemented complete HIIT timer functionality in single-file component
  - Added service worker registration for offline PWA capabilities
  - Created static build process that generates deployable application
  - All core features working: timer, audio cues, settings persistence, progress tracking

- **2025-07-17**: Enhanced UI and prepared for Render deployment ✅
  - Improved audio system with distinctive double-beep pattern
  - Enhanced slider design with visual progress bars and better UX
  - Reduced prepare time to 5 seconds and made timer clickable
  - Improved text contrast and readability throughout app
  - Added Render deployment configuration with render.yaml
  - Configured dynamic port handling for production environments
  - Added health check endpoint for deployment monitoring

- **2025-07-18**: Audio timing and slider improvements ✅
  - Fixed beep timing to sound at exactly 3, 2, and 1 seconds remaining
  - Completely rewrote slider component for smooth drag-and-drop interaction
  - Added pointer capture for seamless touch gestures on mobile
  - Verified Render deployment readiness with successful build and health check tests
  - All deployment configuration confirmed working: render.yaml, build scripts, health endpoint

- **2025-07-20**: Native iOS app conversion and logo design ✅
  - Successfully converted web app to React Native iOS application
  - Created complete mobile app structure with native UI components
  - Designed four unique minimalistic iOS app icons with professional aesthetics
  - Built iOS App Store deployment configuration with bundle ID and permissions
  - Preserved all core HIIT timer functionality in native mobile environment
  - Created comprehensive deployment guides for iOS development and App Store submission

## User Preferences
- Mobile-first design approach
- Dark theme as default
- Audio cues are essential (beeps + voice announcements)
- Background operation capability for multitasking
- Offline functionality preferred
- Simple, intuitive interface

## Features
- Configurable HIIT timer with default settings (40s work, 20s rest)
- Audio beeps for last 3 seconds of intervals
- Voice announcements for phase transitions
- Settings persistence across sessions
- Mobile-optimized circular timer display
- Background operation support
- Offline functionality