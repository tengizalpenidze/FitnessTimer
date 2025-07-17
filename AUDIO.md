# Audio System Documentation

## Overview

The Just HIIT app uses a **multi-layered audio system** for maximum reliability across different devices and deployment scenarios. No external audio files are required - all audio is generated programmatically.

## Audio Features

### 1. Timer Beeps
- **Double-beep pattern**: High tone (1000Hz) followed by lower tone (800Hz)
- **Timing**: Plays at 3, 2, and 1 seconds remaining during workout/rest phases
- **Duration**: 0.1 seconds per beep with 0.12-second spacing

### 2. Voice Announcements
- **Phase transitions**: "Start", "Break", "Rest", "Workout complete!"
- **Language**: English (en-US)
- **Settings**: Rate 1.2x, Volume 90%, Normal pitch

## Technical Implementation

### Audio Methods (in order of preference)

#### 1. Web Audio API (Primary)
- **Technology**: AudioContext with OscillatorNode
- **Advantages**: Most reliable, precise timing, no network dependencies
- **Waveform**: Sine wave for clean sound
- **Browser Support**: All modern browsers

#### 2. HTML5 Audio with Data URL (Fallback)
- **Technology**: HTML5 Audio element with base64-encoded WAV
- **Use case**: When Web Audio API fails or is restricted
- **Data**: Embedded WAV file as data URL (no external files needed)

#### 3. Programmatic Buffer Generation (Last Resort)
- **Technology**: AudioContext with BufferSource
- **Use case**: When other methods fail
- **Generation**: Real-time audio buffer creation with mathematical functions

### Speech Synthesis
- **API**: Web Speech API (SpeechSynthesis)
- **Fallback**: Graceful degradation when not supported
- **Error handling**: Comprehensive error logging and recovery

## Deployment Considerations

### For Render/Production
✅ **No external audio files required**
✅ **No CDN dependencies** 
✅ **Works offline** (PWA compatible)
✅ **Cross-browser compatible**
✅ **No additional build steps needed**

### Browser Permissions
- **User interaction required**: All browsers require user interaction before audio
- **Implementation**: Audio initializes on first timer start or test button
- **Visual feedback**: Clear indicators when audio is ready

## GitHub Repository
- **Audio files**: None required (all programmatic)
- **Dependencies**: Standard Web APIs only
- **Bundle size**: Minimal impact (no audio assets)

## Testing Audio

Use the built-in test buttons:
1. **Test Beep**: Verifies beep generation system
2. **Test Voice**: Verifies speech synthesis
3. **Timer countdown**: Tests integrated audio during actual use

## Troubleshooting

### No Audio on First Visit
- **Cause**: Browser security requires user interaction
- **Solution**: Click test buttons or start timer to initialize

### Beeps Not Working
- **Check**: Console logs for audio method used
- **Fallback**: Multiple backup systems automatically engage

### Voice Not Working  
- **Check**: Browser supports Speech Synthesis API
- **Fallback**: Timer still works without voice announcements

## Browser Compatibility

| Browser | Web Audio | Speech Synthesis | Overall Support |
|---------|-----------|------------------|-----------------|
| Chrome  | ✅ Full   | ✅ Full         | ✅ Excellent    |
| Firefox | ✅ Full   | ✅ Full         | ✅ Excellent    |
| Safari  | ✅ Full   | ✅ Limited      | ✅ Good         |
| Edge    | ✅ Full   | ✅ Full         | ✅ Excellent    |

The app is designed to work on all platforms without requiring any audio file management or external dependencies.