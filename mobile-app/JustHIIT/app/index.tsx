import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import { Audio } from 'expo-av';
import { keepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Timer phases
const PHASES = {
  PREPARE: 'PREPARE',
  WORK: 'WORK', 
  REST: 'REST',
  SET_REST: 'SET_REST',
  COMPLETE: 'COMPLETE'
};

export default function JustHIITApp() {
  // Default settings matching web app
  const [settings, setSettings] = useState({
    workTime: 40,
    restTime: 20, 
    roundsPerSet: 5,
    numberOfSets: 5,
    setRestTime: 60,
    audioEnabled: true,
  });

  const [timerState, setTimerState] = useState({
    currentPhase: PHASES.PREPARE,
    timeRemaining: 5, // 5 second prepare time
    currentRound: 1,
    currentSet: 1,
    isActive: false,
    isPaused: false,
  });

  const [sound, setSound] = useState();
  const [voiceSound, setVoiceSound] = useState();
  const intervalRef = useRef(null);

  // Load settings from storage
  useEffect(() => {
    loadSettings();
  }, []);

  // Audio setup
  useEffect(() => {
    setupAudio();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (voiceSound) {
        voiceSound.unloadAsync();
      }
    };
  }, []);

  // Keep awake when timer is active
  useEffect(() => {
    if (timerState.isActive) {
      keepAwakeAsync();
    } else {
      deactivateKeepAwake();
    }
  }, [timerState.isActive]);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('hiitSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem('hiitSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const setupAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Error setting up audio:', error);
    }
  };

  const playBeep = async () => {
    if (!settings.audioEnabled) return;
    
    try {
      // Try to load beep sound, fallback to haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      console.log('🔊 BEEP!');
    } catch (error) {
      console.error('Error playing beep:', error);
    }
  };

  const playVoice = async (text) => {
    if (!settings.audioEnabled) return;
    
    try {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      console.log(`🗣️ Voice: "${text}"`);
      // Brief alert for voice cues
      Alert.alert('Timer', text, [], { cancelable: true });
    } catch (error) {
      console.error('Error playing voice:', error);
    }
  };

  // Timer logic
  useEffect(() => {
    if (timerState.isActive && !timerState.isPaused) {
      intervalRef.current = setInterval(() => {
        setTimerState(prevState => {
          const newTimeRemaining = prevState.timeRemaining - 1;
          
          // Play beeps at 3, 2, 1 seconds
          if (newTimeRemaining <= 3 && newTimeRemaining >= 1) {
            playBeep();
          }
          
          if (newTimeRemaining <= 0) {
            return handlePhaseTransition(prevState);
          }
          
          return {
            ...prevState,
            timeRemaining: newTimeRemaining
          };
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    
    return () => clearInterval(intervalRef.current);
  }, [timerState.isActive, timerState.isPaused]);

  const handlePhaseTransition = (currentState) => {
    const { currentPhase, currentRound, currentSet } = currentState;
    
    switch (currentPhase) {
      case PHASES.PREPARE:
        playVoice('Start');
        return {
          ...currentState,
          currentPhase: PHASES.WORK,
          timeRemaining: settings.workTime
        };
        
      case PHASES.WORK:
        if (currentRound < settings.roundsPerSet) {
          playVoice('Rest');
          return {
            ...currentState,
            currentPhase: PHASES.REST,
            timeRemaining: settings.restTime,
            currentRound: currentRound + 1
          };
        } else if (currentSet < settings.numberOfSets) {
          playVoice('Set Rest');
          return {
            ...currentState,
            currentPhase: PHASES.SET_REST,
            timeRemaining: settings.setRestTime,
            currentRound: 1,
            currentSet: currentSet + 1
          };
        } else {
          return completeWorkout(currentState);
        }
        
      case PHASES.REST:
        playVoice('Work');
        return {
          ...currentState,
          currentPhase: PHASES.WORK,
          timeRemaining: settings.workTime
        };
        
      case PHASES.SET_REST:
        playVoice('Work');
        return {
          ...currentState,
          currentPhase: PHASES.WORK,
          timeRemaining: settings.workTime
        };
        
      default:
        return currentState;
    }
  };

  const completeWorkout = (currentState) => {
    clearInterval(intervalRef.current);
    playVoice('Workout Complete!');
    
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    return {
      ...currentState,
      currentPhase: PHASES.COMPLETE,
      timeRemaining: 0,
      isActive: false
    };
  };

  const startTimer = () => {
    if (timerState.currentPhase === PHASES.COMPLETE) {
      // Reset workout
      setTimerState({
        currentPhase: PHASES.PREPARE,
        timeRemaining: 5,
        currentRound: 1,
        currentSet: 1,
        isActive: true,
        isPaused: false,
      });
    } else {
      setTimerState(prev => ({
        ...prev,
        isActive: true,
        isPaused: false,
      }));
    }
  };

  const pauseTimer = () => {
    setTimerState(prev => ({
      ...prev,
      isPaused: !prev.isPaused,
    }));
  };

  const resetTimer = () => {
    clearInterval(intervalRef.current);
    setTimerState({
      currentPhase: PHASES.PREPARE,
      timeRemaining: 5,
      currentRound: 1,
      currentSet: 1,
      isActive: false,
      isPaused: false,
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseText = () => {
    switch (timerState.currentPhase) {
      case PHASES.PREPARE: return 'Get Ready';
      case PHASES.WORK: return 'WORK';
      case PHASES.REST: return 'REST';
      case PHASES.SET_REST: return 'SET REST';
      case PHASES.COMPLETE: return 'COMPLETE!';
      default: return '';
    }
  };

  const getPhaseColor = () => {
    switch (timerState.currentPhase) {
      case PHASES.PREPARE: return ['#3B82F6', '#1E40AF'];
      case PHASES.WORK: return ['#EF4444', '#DC2626'];
      case PHASES.REST: return ['#10B981', '#059669'];
      case PHASES.SET_REST: return ['#F59E0B', '#D97706'];
      case PHASES.COMPLETE: return ['#8B5CF6', '#7C3AED'];
      default: return ['#6B7280', '#4B5563'];
    }
  };

  const getActionButtonText = () => {
    if (!timerState.isActive) return 'START';
    if (timerState.isPaused) return 'RESUME';
    return 'PAUSE';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <LinearGradient
        colors={['#1F2937', '#111827']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Just HIIT</Text>
          <Text style={styles.subtitle}>
            Set {timerState.currentSet} of {settings.numberOfSets} • Round {timerState.currentRound} of {settings.roundsPerSet}
          </Text>
        </View>

        {/* Timer Circle */}
        <View style={styles.timerContainer}>
          <LinearGradient
            colors={getPhaseColor()}
            style={styles.timerCircle}
          >
            <View style={styles.timerInner}>
              <Text style={styles.phaseText}>{getPhaseText()}</Text>
              <Text style={styles.timeText}>{formatTime(timerState.timeRemaining)}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Control Buttons */}
        <View style={styles.controls}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]} 
            onPress={startTimer}
          >
            <Text style={styles.buttonText}>{getActionButtonText()}</Text>
          </TouchableOpacity>
          
          {timerState.isActive && (
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]} 
              onPress={pauseTimer}
            >
              <Text style={styles.buttonText}>{timerState.isPaused ? 'RESUME' : 'PAUSE'}</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={resetTimer}
          >
            <Text style={styles.buttonText}>RESET</Text>
          </TouchableOpacity>
        </View>

        {/* Settings Display */}
        <View style={styles.settingsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Work</Text>
            <Text style={styles.statValue}>{settings.workTime}s</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Rest</Text>
            <Text style={styles.statValue}>{settings.restTime}s</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Sets</Text>
            <Text style={styles.statValue}>{settings.numberOfSets}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Rounds</Text>
            <Text style={styles.statValue}>{settings.roundsPerSet}</Text>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  gradient: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  timerContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  timerCircle: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: (width * 0.7) / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerInner: {
    width: '85%',
    height: '85%',
    borderRadius: (width * 0.7 * 0.85) / 2,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  phaseText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  timeText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
    minWidth: 100,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#EF4444',
  },
  secondaryButton: {
    backgroundColor: '#374151',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});