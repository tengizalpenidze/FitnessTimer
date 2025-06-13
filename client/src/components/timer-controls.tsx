import { Play, Pause, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TimerControlsProps {
  timerState: {
    isRunning: boolean;
    isPaused: boolean;
  };
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
}

export default function TimerControls({ timerState, onStart, onPause, onStop }: TimerControlsProps) {
  const showStartButton = !timerState.isRunning || timerState.isPaused;

  return (
    <div className="flex space-x-4">
      {showStartButton ? (
        <Button
          onClick={onStart}
          className="bg-secondary hover:bg-green-700 text-white font-bold py-4 px-8 rounded-full text-xl transition-all transform hover:scale-105 ripple"
          size="lg"
        >
          <Play className="w-5 h-5 mr-2" />
          START
        </Button>
      ) : (
        <Button
          onClick={onPause}
          className="bg-warning hover:bg-orange-700 text-white font-bold py-4 px-8 rounded-full text-xl transition-all transform hover:scale-105 ripple"
          size="lg"
        >
          <Pause className="w-5 h-5 mr-2" />
          PAUSE
        </Button>
      )}
      
      <Button
        onClick={onStop}
        className="bg-error hover:bg-red-800 text-white font-bold py-4 px-6 rounded-full text-xl transition-all transform hover:scale-105 ripple"
        size="lg"
      >
        <Square className="w-5 h-5" />
      </Button>
    </div>
  );
}
