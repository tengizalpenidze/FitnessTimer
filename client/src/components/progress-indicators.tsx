interface ProgressIndicatorsProps {
  timerState: {
    currentRound: number;
    currentSet: number;
  };
  settings: {
    roundsPerSet: number;
    numberOfSets: number;
  };
}

export default function ProgressIndicators({ timerState, settings }: ProgressIndicatorsProps) {
  return (
    <div className="w-full max-w-md space-y-4">
      {/* Round Progress */}
      <div className="text-center">
        <div className="text-sm text-gray-400 mb-2">Round</div>
        <div className="flex justify-center space-x-2">
          {Array.from({ length: settings.roundsPerSet }, (_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full ${
                index < timerState.currentRound ? 'bg-secondary' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
        <div className="text-lg font-semibold mt-2">
          {timerState.currentRound} / {settings.roundsPerSet}
        </div>
      </div>

      {/* Set Progress */}
      <div className="text-center">
        <div className="text-sm text-gray-400 mb-2">Set</div>
        <div className="flex justify-center space-x-2">
          {Array.from({ length: settings.numberOfSets }, (_, index) => (
            <div
              key={index}
              className={`w-4 h-4 rounded-full ${
                index < timerState.currentSet ? 'bg-primary' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
        <div className="text-lg font-semibold mt-2">
          {timerState.currentSet} / {settings.numberOfSets}
        </div>
      </div>
    </div>
  );
}
