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

const { width, height } = Dimensions.get('window');

// Timer phases
const PHASES = {
  PREPARE: 'prepare',
  WORKOUT: 'workout',
  REST: 'rest',
  SET_REST: 'setrest',
  COMPLETE: 'complete'
};

export default function App() {
  // Timer settings
  const [settings, setSettings] = useState({
    workoutTime: 40,
    restTime: 20,
    roundsPerSet: 5,
    numberOfSets: 5,
    setRestTime: 60,
    audioEnabled: true,
  });

  // Timer state
  const [timerState, setTimerState] = useState({
    isActive: false,
    currentPhase: PHASES.PREPARE,
    timeRemaining: 5, // 5 second prepare time
    currentRound: 1,
    currentSet: 1,
    totalTime: 0,
  });

  // Audio
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
      const { sound: newSound } = await Audio.Sound.createAsync(
        require('./assets/beep.mp3'), // We'll need to add this audio file
        { shouldPlay: true, volume: 0.8 }
      );
      await newSound.playAsync();
      setTimeout(() => newSound.unloadAsync(), 1000);
      
      // Add haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      console.error('Error playing beep:', error);
      // Fallback to haptic only
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }
  };

  const playVoice = async (text) => {
    if (!settings.audioEnabled) return;
    
    try {
      // For now, use haptic feedback and console log
      // Future: Implement text-to-speech or audio files
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      console.log(`🗣️ Voice: "${text}"`);
      // Show brief alert for voice cues
      Alert.alert('Timer', text, [], { cancelable: true });
    } catch (error) {
      console.error('Error playing voice:', error);
    }
  };

  const startTimer = () => {
    setTimerState(prev => ({ 
      ...prev, 
      isActive: true,
      currentPhase: PHASES.PREPARE,
      timeRemaining: 5,
      currentRound: 1,
      currentSet: 1,
      totalTime: 0
    }));

    playVoice('Get Ready');
    
    intervalRef.current = setInterval(() => {
      setTimerState(prev => {
        const newTimeRemaining = prev.timeRemaining - 1;
        
        // Play beep for last 3 seconds
        if ((prev.currentPhase === PHASES.WORKOUT || prev.currentPhase === PHASES.REST || prev.currentPhase === PHASES.SET_REST) && 
            (newTimeRemaining === 3 || newTimeRemaining === 2 || newTimeRemaining === 1)) {
          setTimeout(() => playBeep(), 100);
        }
        
        if (newTimeRemaining <= 0) {
          return handlePhaseTransition(prev);
        }
        
        return {
          ...prev,
          timeRemaining: newTimeRemaining,
          totalTime: prev.totalTime + 1
        };
      });
    }, 1000);
  };

  const handlePhaseTransition = (currentState) => {
    const { currentPhase, currentRound, currentSet } = currentState;
    
    switch (currentPhase) {
      case PHASES.PREPARE:
        playVoice('Start');
        return {
          ...currentState,
          currentPhase: PHASES.WORKOUT,
          timeRemaining: settings.workoutTime
        };
        
      case PHASES.WORKOUT:
        if (currentRound < settings.roundsPerSet) {
          playVoice('Rest');
          return {
            ...currentState,
            currentPhase: PHASES.REST,
            timeRemaining: settings.restTime,
            currentRound: currentRound + 1
          };
        } else if (currentSet < settings.numberOfSets) {
          playVoice('Set Complete - Long Rest');
          return {
            ...currentState,
            currentPhase: PHASES.SET_REST,
            timeRemaining: settings.setRestTime,
            currentSet: currentSet + 1,
            currentRound: 1
          };
        } else {
          return completeWorkout(currentState);
        }
        
      case PHASES.REST:
        playVoice('Start');
        return {
          ...currentState,
          currentPhase: PHASES.WORKOUT,
          timeRemaining: settings.workoutTime
        };
        
      case PHASES.SET_REST:
        playVoice('New Set - Start');
        return {
          ...currentState,
          currentPhase: PHASES.WORKOUT,
          timeRemaining: settings.workoutTime
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
      isActive: false,
      currentPhase: PHASES.COMPLETE,
      timeRemaining: 0
    };
  };

  const stopTimer = () => {
    clearInterval(intervalRef.current);
    setTimerState({
      isActive: false,
      currentPhase: PHASES.PREPARE,
      timeRemaining: 5,
      currentRound: 1,
      currentSet: 1,
      totalTime: 0
    });
  };

  const resetTimer = () => {
    stopTimer();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseColor = () => {
    switch (timerState.currentPhase) {
      case PHASES.WORKOUT: return ['#EF4444', '#DC2626']; // Red gradient
      case PHASES.REST: return ['#10B981', '#059669']; // Green gradient  
      case PHASES.SET_REST: return ['#3B82F6', '#2563EB']; // Blue gradient
      case PHASES.COMPLETE: return ['#8B5CF6', '#7C3AED']; // Purple gradient
      default: return ['#6B7280', '#4B5563']; // Gray gradient
    }
  };

  const getPhaseText = () => {
    switch (timerState.currentPhase) {
      case PHASES.PREPARE: return 'Get Ready';
      case PHASES.WORKOUT: return 'WORK';
      case PHASES.REST: return 'REST';
      case PHASES.SET_REST: return 'SET REST';
      case PHASES.COMPLETE: return 'COMPLETE!';
      default: return 'READY';
    }
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

        {/* Controls */}
        <View style={styles.controls}>
          {!timerState.isActive ? (
            <TouchableOpacity style={styles.startButton} onPress={startTimer}>
              <Text style={styles.buttonText}>START</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.controlRow}>
              <TouchableOpacity style={styles.stopButton} onPress={stopTimer}>
                <Text style={styles.buttonText}>STOP</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Work</Text>
            <Text style={styles.statValue}>{settings.workoutTime}s</Text>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  timerCircle: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  timerInner: {
    width: width * 0.65,
    height: width * 0.65,
    borderRadius: width * 0.325,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  timeText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  controls: {
    paddingHorizontal: 40,
    paddingBottom: 20,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  startButton: {
    backgroundColor: '#10B981',
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  stopButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
