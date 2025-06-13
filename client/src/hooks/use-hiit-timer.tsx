import { useState, useEffect, useRef, useCallback } from "react";

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
  phaseJustChanged: boolean;
}

const defaultSettings: TimerSettings = {
  workoutTime: 40,
  restTime: 20,
  roundsPerSet: 5,
  numberOfSets: 5,
  setRestTime: 60,
  audioEnabled: true,
};

export function useHIITTimer() {
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
    phaseJustChanged: false,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const workerRef = useRef<Worker | null>(null);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('hiitSettings', JSON.stringify(settings));
  }, [settings]);

  const advancePhase = useCallback((currentState: TimerState, currentSettings: TimerSettings): TimerState => {
    switch (currentState.currentPhase) {
      case 'workout':
        if (currentState.currentRound < currentSettings.roundsPerSet) {
          // Move to rest
          return {
            ...currentState,
            currentPhase: 'rest',
            timeRemaining: currentSettings.restTime,
            totalTime: currentSettings.restTime,
            phaseJustChanged: true,
          };
        } else {
          // End of set
          if (currentState.currentSet < currentSettings.numberOfSets) {
            return {
              ...currentState,
              currentPhase: 'setrest',
              timeRemaining: currentSettings.setRestTime,
              totalTime: currentSettings.setRestTime,
              phaseJustChanged: true,
            };
          } else {
            // Workout complete
            return {
              ...currentState,
              currentPhase: 'complete',
              isRunning: false,
              phaseJustChanged: true,
            };
          }
        }

      case 'rest':
        // Move to next round
        return {
          ...currentState,
          currentRound: currentState.currentRound + 1,
          currentPhase: 'workout',
          timeRemaining: currentSettings.workoutTime,
          totalTime: currentSettings.workoutTime,
          phaseJustChanged: true,
        };

      case 'setrest':
        // Move to next set
        return {
          ...currentState,
          currentSet: currentState.currentSet + 1,
          currentRound: 1,
          currentPhase: 'workout',
          timeRemaining: currentSettings.workoutTime,
          totalTime: currentSettings.workoutTime,
          phaseJustChanged: true,
        };

      default:
        return currentState;
    }
  }, []);

  const tick = useCallback(() => {
    setTimerState(prev => {
      if (!prev.isRunning || prev.isPaused) return prev;

      const newTimeRemaining = prev.timeRemaining - 1;
      
      if (newTimeRemaining <= 0) {
        return advancePhase(prev, settings);
      }

      return {
        ...prev,
        timeRemaining: newTimeRemaining,
        phaseJustChanged: false,
      };
    });
  }, [advancePhase, settings]);

  // Initialize service worker for background timer
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }

    // Create web worker for precise timing
    const workerCode = `
      let intervalId = null;
      
      self.onmessage = function(e) {
        if (e.data.type === 'start') {
          intervalId = setInterval(() => {
            self.postMessage({ type: 'tick' });
          }, 1000);
        } else if (e.data.type === 'stop') {
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        }
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    workerRef.current = new Worker(URL.createObjectURL(blob));

    workerRef.current.onmessage = (e) => {
      if (e.data.type === 'tick') {
        tick();
      }
    };

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [tick]);

  const startTimer = useCallback(() => {
    setTimerState(prev => {
      if (!prev.isRunning) {
        // First start - reset timer
        const newState = {
          ...prev,
          isRunning: true,
          isPaused: false,
          currentPhase: 'workout' as const,
          currentRound: 1,
          currentSet: 1,
          timeRemaining: settings.workoutTime,
          totalTime: settings.workoutTime,
          phaseJustChanged: true,
        };
        
        if (workerRef.current) {
          workerRef.current.postMessage({ type: 'start' });
        }
        
        return newState;
      } else {
        // Resume from pause
        const newState = {
          ...prev,
          isPaused: false,
        };
        
        if (workerRef.current) {
          workerRef.current.postMessage({ type: 'start' });
        }
        
        return newState;
      }
    });
  }, [settings.workoutTime]);

  const pauseTimer = useCallback(() => {
    setTimerState(prev => ({
      ...prev,
      isPaused: true,
    }));
    
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'stop' });
    }
  }, []);

  const stopTimer = useCallback(() => {
    setTimerState({
      isRunning: false,
      isPaused: false,
      currentPhase: 'ready',
      currentRound: 1,
      currentSet: 1,
      timeRemaining: settings.workoutTime,
      totalTime: settings.workoutTime,
      phaseJustChanged: false,
    });
    
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'stop' });
    }
  }, [settings.workoutTime]);

  const updateSettings = useCallback((newSettings: TimerSettings) => {
    setSettings(newSettings);
    
    // Reset timer if not running
    if (!timerState.isRunning) {
      setTimerState(prev => ({
        ...prev,
        timeRemaining: newSettings.workoutTime,
        totalTime: newSettings.workoutTime,
      }));
    }
  }, [timerState.isRunning]);

  return {
    timerState,
    settings,
    startTimer,
    pauseTimer,
    stopTimer,
    updateSettings,
  };
}
