import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import TimerDisplay from "@/components/timer-display";
import TimerControls from "@/components/timer-controls";
import ProgressIndicators from "@/components/progress-indicators";
import SettingsPanel from "@/components/settings-panel";
import { useHIITTimer } from "@/hooks/use-hiit-timer";
import { useAudio } from "@/hooks/use-audio";
import { useWakeLock } from "@/hooks/use-wake-lock";

export default function Home() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const {
    timerState,
    settings,
    startTimer,
    pauseTimer,
    stopTimer,
    updateSettings
  } = useHIITTimer();

  const { initAudio, playBeep, playPulse, speak } = useAudio(settings.audioEnabled);
  const { requestWakeLock, releaseWakeLock } = useWakeLock();

  // Handle audio cues based on timer state
  useEffect(() => {
    if (timerState.isRunning && timerState.phaseJustChanged) {
      switch (timerState.currentPhase) {
        case 'workout':
          playBeep();
          speak('Start');
          break;
        case 'rest':
          speak('Break');
          break;
        case 'setrest':
          speak('Rest');
          break;
        case 'complete':
          speak('Workout complete! Great job!');
          break;
      }
    }
  }, [timerState.currentPhase, timerState.phaseJustChanged, timerState.isRunning]);

  // Handle pulse sound for last 3 seconds
  useEffect(() => {
    if (timerState.timeRemaining <= 3 && 
        timerState.timeRemaining > 0 && 
        timerState.currentPhase === 'workout' &&
        timerState.isRunning) {
      playPulse();
    }
  }, [timerState.timeRemaining, timerState.currentPhase, timerState.isRunning]);

  // Handle wake lock
  useEffect(() => {
    if (timerState.isRunning && !timerState.isPaused) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }
    
    return () => releaseWakeLock();
  }, [timerState.isRunning, timerState.isPaused]);

  const handleStart = () => {
    initAudio();
    startTimer();
  };

  const handleSettingsChange = (newSettings: typeof settings) => {
    updateSettings(newSettings);
    setIsSettingsOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Free HIIT</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-full hover:bg-gray-700 transition-colors"
          >
            <Settings className="h-6 w-6" />
          </Button>
        </div>
      </header>

      {/* Main Timer Interface */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
        <TimerDisplay timerState={timerState} />
        <ProgressIndicators 
          timerState={timerState} 
          settings={settings}
        />
        <TimerControls
          timerState={timerState}
          onStart={handleStart}
          onPause={pauseTimer}
          onStop={stopTimer}
        />
      </main>

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSettingsChange}
      />
    </div>
  );
}
