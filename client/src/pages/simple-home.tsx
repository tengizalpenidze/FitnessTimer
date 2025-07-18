import { useState, useEffect, useCallback, useRef } from "react";
import { SimpleButton } from "../components/simple-button";
import { Slider } from "../components/slider";

interface TimerSettings {
  workoutTime: number;
  restTime: number;
  roundsPerSet: number;
  numberOfSets: number;
  setRestTime: number;
  audioEnabled: boolean;
}

interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  currentPhase: 'ready' | 'workout' | 'rest' | 'setrest' | 'complete';
  currentRound: number;
  currentSet: number;
  timeRemaining: number;
  totalTime: number;
}

const defaultSettings: TimerSettings = {
  workoutTime: 40,
  restTime: 20,
  roundsPerSet: 5,
  numberOfSets: 5,
  setRestTime: 60,
  audioEnabled: true,
};

const PREPARE_TIME = 5; // Reduced to 5 seconds

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function SimpleHome() {
  const [settings, setSettings] = useState<TimerSettings>(() => {
    const saved = localStorage.getItem('hiitSettings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    isPaused: false,
    currentPhase: 'ready',
    currentRound: 1,
    currentSet: 1,
    timeRemaining: settings.workoutTime,
    totalTime: settings.workoutTime,
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('hiitSettings', JSON.stringify(settings));
  }, [settings]);

  // Simple audio initialization
  const initializeAudio = useCallback(async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      setAudioInitialized(true);
    } catch (error) {
      console.log('Audio initialization failed:', error);
    }
  }, []);

  // Simple, reliable beep function
  const playBeep = useCallback(async () => {
    if (!settings.audioEnabled) return;
    
    try {
      // Initialize audio if needed
      await initializeAudio();
      
      if (!audioContextRef.current || audioContextRef.current.state !== 'running') {
        // Try HTML5 audio fallback
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMeAz2M0/LLeSsFJXfD7N2UQwoUW7Pp68hLFfI=');
        audio.volume = 0.5;
        await audio.play();
        return;
      }
      
      // Web Audio API beep
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContextRef.current.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, audioContextRef.current.currentTime + 0.15);
      
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + 0.15);
      
    } catch (error) {
      console.log('Beep failed:', error);
    }
  }, [settings.audioEnabled, initializeAudio]);

  // Simple, direct voice function
  const speak = useCallback((text: string) => {
    if (!settings.audioEnabled || !('speechSynthesis' in window)) return;
    
    try {
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = 1.0;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      speechSynthesis.speak(utterance);
    } catch (error) {
      console.log('Voice failed:', error);
    }
  }, [settings.audioEnabled]);

  // Timer logic
  const advancePhase = useCallback((currentState: TimerState): TimerState => {
    const { currentPhase, currentRound, currentSet } = currentState;
    
    switch (currentPhase) {
      case 'ready':
        speak('Start');
        playBeep();
        return {
          ...currentState,
          currentPhase: 'workout',
          timeRemaining: settings.workoutTime,
          totalTime: settings.workoutTime,
        };
      
      case 'workout':
        if (currentRound < settings.roundsPerSet) {
          speak('Break');
          return {
            ...currentState,
            currentPhase: 'rest',
            currentRound: currentRound + 1,
            timeRemaining: settings.restTime,
            totalTime: settings.restTime,
          };
        } else if (currentSet < settings.numberOfSets) {
          speak('Rest');
          return {
            ...currentState,
            currentPhase: 'setrest',
            currentRound: 1,
            currentSet: currentSet + 1,
            timeRemaining: settings.setRestTime,
            totalTime: settings.setRestTime,
          };
        } else {
          speak('Workout complete! Great job!');
          return {
            ...currentState,
            currentPhase: 'complete',
            isRunning: false,
            timeRemaining: 0,
            totalTime: 0,
          };
        }
      
      case 'rest':
        speak('Start');
        playBeep();
        return {
          ...currentState,
          currentPhase: 'workout',
          timeRemaining: settings.workoutTime,
          totalTime: settings.workoutTime,
        };
      
      case 'setrest':
        speak('Start');
        playBeep();
        return {
          ...currentState,
          currentPhase: 'workout',
          timeRemaining: settings.workoutTime,
          totalTime: settings.workoutTime,
        };
      
      default:
        return currentState;
    }
  }, [settings, speak, playBeep]);

  // Timer effects
  useEffect(() => {
    if (timerState.isRunning && !timerState.isPaused) {
      intervalRef.current = setInterval(() => {
        setTimerState(prev => {
          const newTimeRemaining = prev.timeRemaining - 1;
          
          // Play beep for last 3 seconds (when countdown shows 3, 2, 1)
          if ((prev.currentPhase === 'workout' || prev.currentPhase === 'rest' || prev.currentPhase === 'setrest') && 
              (newTimeRemaining === 2 || newTimeRemaining === 1 || newTimeRemaining === 0)) {
            setTimeout(() => playBeep(), 100); // Small delay to ensure audio context is ready
          }
          
          if (newTimeRemaining <= 0) {
            return advancePhase({ ...prev, timeRemaining: 0 });
          }
          
          return {
            ...prev,
            timeRemaining: newTimeRemaining,
          };
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timerState.isRunning, timerState.isPaused, advancePhase, playBeep]);

  const startTimer = () => {
    // Initialize audio on first user interaction
    if (!audioInitialized) {
      initializeAudio();
    }
    setTimerState(prev => ({ 
      ...prev, 
      isRunning: true, 
      isPaused: false,
      currentPhase: 'ready',
      timeRemaining: PREPARE_TIME,
      totalTime: PREPARE_TIME
    }));
  };

  const handleTimerClick = () => {
    if (!timerState.isRunning) {
      startTimer();
    } else if (timerState.isPaused) {
      pauseTimer();
    } else {
      stopTimer();
    }
  };

  const pauseTimer = () => {
    setTimerState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const stopTimer = () => {
    setTimerState({
      isRunning: false,
      isPaused: false,
      currentPhase: 'ready',
      currentRound: 1,
      currentSet: 1,
      timeRemaining: settings.workoutTime,
      totalTime: settings.workoutTime,
    });
  };

  const getPhaseColor = () => {
    switch (timerState.currentPhase) {
      case 'workout': return 'bg-green-500';
      case 'rest': return 'bg-yellow-500';
      case 'setrest': return 'bg-blue-500';
      case 'complete': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getPhaseText = () => {
    switch (timerState.currentPhase) {
      case 'ready': return 'Ready to Start';
      case 'workout': return 'WORKOUT';
      case 'rest': return 'REST';
      case 'setrest': return 'SET REST';
      case 'complete': return 'COMPLETE!';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 text-white">Just HIIT</h1>
        </div>

        {/* Timer Display */}
        <div 
          className={`relative w-80 h-80 mx-auto mb-8 rounded-full ${getPhaseColor()} flex items-center justify-center transition-colors duration-300 cursor-pointer hover:opacity-90 ${
            timerState.timeRemaining <= 3 && timerState.timeRemaining > 0 && (timerState.currentPhase === 'workout' || timerState.currentPhase === 'rest' || timerState.currentPhase === 'setrest') 
              ? 'ring-4 ring-red-500 ring-opacity-75 animate-pulse' 
              : ''
          }`}
          onClick={handleTimerClick}
        >
          <div className="text-center">
            <div className="text-5xl font-mono font-bold mb-2 text-white drop-shadow-lg">
              {formatTime(timerState.timeRemaining)}
            </div>
            <div className="text-lg font-medium text-white drop-shadow-md">
              {getPhaseText()}
            </div>
            {timerState.timeRemaining <= 3 && timerState.timeRemaining > 0 && (timerState.currentPhase === 'workout' || timerState.currentPhase === 'rest' || timerState.currentPhase === 'setrest') && (
              <div className="text-xs text-red-200 mt-1">
                🔊 Beeping
              </div>
            )}
          </div>
        </div>

        {/* Progress Info */}
        <div className="text-center mb-8">
          <div className="text-lg mb-2 text-white font-medium">
            Round {timerState.currentRound} of {settings.roundsPerSet}
          </div>
          <div className="text-lg text-white font-medium">
            Set {timerState.currentSet} of {settings.numberOfSets}
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-4 justify-center mb-8">
          {!timerState.isRunning ? (
            <SimpleButton onClick={startTimer} variant="primary">
              Start
            </SimpleButton>
          ) : (
            <SimpleButton onClick={pauseTimer} variant="secondary">
              {timerState.isPaused ? 'Resume' : 'Pause'}
            </SimpleButton>
          )}
          <SimpleButton onClick={stopTimer} variant="outline">
            Stop
          </SimpleButton>
        </div>

        {/* Simple Audio Test */}
        <div className="border border-gray-600 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3 text-white">Audio Test</h3>
          <div className="flex gap-3 mb-3">
            <SimpleButton onClick={playBeep} variant="secondary" size="sm">
              Test Beep
            </SimpleButton>
            <SimpleButton onClick={() => speak('Test voice')} variant="secondary" size="sm">
              Test Voice
            </SimpleButton>
          </div>
          <div className="text-sm text-gray-400">
            Audio: {settings.audioEnabled ? 'Enabled' : 'Disabled'} | 
            Context: {audioContextRef.current?.state || 'None'} | 
            Voice: {'speechSynthesis' in window ? 'Available' : 'Not Available'}
          </div>
        </div>

        {/* Settings Button */}
        <div className="text-center">
          <SimpleButton 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)} 
            variant="outline"
          >
            {isSettingsOpen ? 'Hide Settings' : 'Settings'}
          </SimpleButton>
        </div>

        {/* Settings Panel */}
        {isSettingsOpen && (
          <div className="mt-8 p-6 bg-gray-800 rounded-lg">
            <h3 className="text-xl font-bold mb-6">Settings</h3>
            
            <div className="space-y-6">
              <Slider
                label="Workout Time (seconds)"
                value={settings.workoutTime}
                onChange={(value) => setSettings(prev => ({ ...prev, workoutTime: value }))}
                min={10}
                max={180}
                step={5}
              />
              
              <Slider
                label="Rest Time (seconds)"
                value={settings.restTime}
                onChange={(value) => setSettings(prev => ({ ...prev, restTime: value }))}
                min={5}
                max={120}
                step={5}
              />
              
              <Slider
                label="Rounds per Set"
                value={settings.roundsPerSet}
                onChange={(value) => setSettings(prev => ({ ...prev, roundsPerSet: value }))}
                min={1}
                max={20}
                step={1}
              />
              
              <Slider
                label="Number of Sets"
                value={settings.numberOfSets}
                onChange={(value) => setSettings(prev => ({ ...prev, numberOfSets: value }))}
                min={1}
                max={10}
                step={1}
              />
              
              <Slider
                label="Set Rest Time (seconds)"
                value={settings.setRestTime}
                onChange={(value) => setSettings(prev => ({ ...prev, setRestTime: value }))}
                min={30}
                max={300}
                step={10}
              />
              
              <div className="flex items-center justify-between pt-4">
                <label htmlFor="audioEnabled" className="text-sm font-medium text-gray-300">Enable Audio</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="audioEnabled"
                    checked={settings.audioEnabled}
                    onChange={(e) => setSettings(prev => ({ ...prev, audioEnabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              {settings.audioEnabled && (
                <div className="flex gap-2 pt-2">
                  <SimpleButton 
                    onClick={() => {
                      if (!audioInitialized) initializeAudio();
                      playBeep();
                    }}
                    variant="outline"
                    className="text-xs px-3 py-1"
                  >
                    Test Beep
                  </SimpleButton>
                  <SimpleButton 
                    onClick={() => {
                      if (!audioInitialized) initializeAudio();
                      speak('Test audio working');
                    }}
                    variant="outline"
                    className="text-xs px-3 py-1"
                  >
                    Test Voice
                  </SimpleButton>
                </div>
              )}
              
              {!audioInitialized && settings.audioEnabled && (
                <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 mt-4">
                  <p className="text-sm text-yellow-200">
                    🔊 Audio will be enabled when you start the timer or test audio (browser requirement)
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}