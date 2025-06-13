import { formatTime } from "@/lib/timer-utils";

interface TimerDisplayProps {
  timerState: {
    currentPhase: string;
    timeRemaining: number;
    totalTime: number;
    isRunning: boolean;
  };
}

export default function TimerDisplay({ timerState }: TimerDisplayProps) {
  const progress = timerState.totalTime > 0 
    ? ((timerState.totalTime - timerState.timeRemaining) / timerState.totalTime) * 100 
    : 0;

  const phaseConfig = {
    ready: { text: 'READY', description: 'Press start to begin', color: 'text-gray-400' },
    workout: { text: 'WORK OUT', description: 'Push yourself!', color: 'text-secondary' },
    rest: { text: 'REST', description: 'Take a breather', color: 'text-warning' },
    setrest: { text: 'SET BREAK', description: 'Long rest between sets', color: 'text-primary' },
    complete: { text: 'COMPLETE', description: 'Great job!', color: 'text-secondary' }
  };

  const config = phaseConfig[timerState.currentPhase as keyof typeof phaseConfig] || phaseConfig.ready;

  const showPulse = timerState.timeRemaining <= 3 && 
                   timerState.timeRemaining > 0 && 
                   timerState.currentPhase === 'workout' &&
                   timerState.isRunning;

  return (
    <div className="flex flex-col items-center space-y-8">
      {/* Current Phase Indicator */}
      <div className="text-center">
        <div className={`text-4xl font-bold mb-2 ${config.color}`}>
          {config.text}
        </div>
        <div className="text-lg text-gray-400">
          {config.description}
        </div>
      </div>

      {/* Timer Circle */}
      <div className="relative">
        <div 
          className="timer-circle w-80 h-80 rounded-full flex items-center justify-center border-8 border-gray-700"
          style={{ '--progress': `${progress}%` } as React.CSSProperties}
        >
          <div className="text-center">
            <div className="text-6xl font-mono font-bold">
              {formatTime(timerState.timeRemaining)}
            </div>
            <div className="text-lg text-gray-400 mt-2">
              {timerState.currentPhase === 'workout' ? 'Workout Time' : 
               timerState.currentPhase === 'rest' ? 'Rest Time' : 
               timerState.currentPhase === 'setrest' ? 'Set Break' : ''}
            </div>
          </div>
        </div>
        
        {/* Pulse overlay for last 3 seconds */}
        {showPulse && (
          <div className="absolute inset-0 rounded-full border-8 border-error opacity-100 pulse-animation" />
        )}
      </div>
    </div>
  );
}
