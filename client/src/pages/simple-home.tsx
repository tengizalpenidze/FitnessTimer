import { useState, useEffect, useCallback, useRef } from "react";
import { SimpleButton } from "../components/simple-button";

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
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('hiitSettings', JSON.stringify(settings));
  }, [settings]);

  // Audio functions
  const playBeep = useCallback(() => {
    if (!settings.audioEnabled) return;
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
  }, [settings.audioEnabled]);

  const speak = useCallback((text: string) => {
    if (!settings.audioEnabled || !('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.volume = 0.8;
    speechSynthesis.speak(utterance);
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
          if (prev.timeRemaining <= 1) {
            return advancePhase(prev);
          }
          
          // Play beep for last 3 seconds
          if (prev.timeRemaining <= 3 && prev.timeRemaining > 0) {
            playBeep();
          }
          
          return {
            ...prev,
            timeRemaining: prev.timeRemaining - 1,
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
    setTimerState(prev => ({ ...prev, isRunning: true, isPaused: false }));
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
          <h1 className="text-3xl font-bold mb-2">Just HIIT</h1>
          <p className="text-gray-400">High Intensity Interval Timer</p>
        </div>

        {/* Timer Display */}
        <div className={`relative w-80 h-80 mx-auto mb-8 rounded-full ${getPhaseColor()} flex items-center justify-center transition-colors duration-300`}>
          <div className="text-center">
            <div className="text-5xl font-mono font-bold mb-2">
              {formatTime(timerState.timeRemaining)}
            </div>
            <div className="text-lg font-medium">
              {getPhaseText()}
            </div>
          </div>
        </div>

        {/* Progress Info */}
        <div className="text-center mb-8">
          <div className="text-lg mb-2">
            Round {timerState.currentRound} of {settings.roundsPerSet}
          </div>
          <div className="text-lg">
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
            <h3 className="text-xl font-bold mb-4">Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Workout Time (seconds)</label>
                <input
                  type="number"
                  value={settings.workoutTime}
                  onChange={(e) => setSettings(prev => ({ ...prev, workoutTime: parseInt(e.target.value) || 40 }))}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Rest Time (seconds)</label>
                <input
                  type="number"
                  value={settings.restTime}
                  onChange={(e) => setSettings(prev => ({ ...prev, restTime: parseInt(e.target.value) || 20 }))}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Rounds per Set</label>
                <input
                  type="number"
                  value={settings.roundsPerSet}
                  onChange={(e) => setSettings(prev => ({ ...prev, roundsPerSet: parseInt(e.target.value) || 5 }))}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Number of Sets</label>
                <input
                  type="number"
                  value={settings.numberOfSets}
                  onChange={(e) => setSettings(prev => ({ ...prev, numberOfSets: parseInt(e.target.value) || 5 }))}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Set Rest Time (seconds)</label>
                <input
                  type="number"
                  value={settings.setRestTime}
                  onChange={(e) => setSettings(prev => ({ ...prev, setRestTime: parseInt(e.target.value) || 60 }))}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="audioEnabled"
                  checked={settings.audioEnabled}
                  onChange={(e) => setSettings(prev => ({ ...prev, audioEnabled: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="audioEnabled" className="text-sm font-medium">Enable Audio</label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}