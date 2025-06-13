export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function calculateProgress(timeRemaining: number, totalTime: number): number {
  if (totalTime === 0) return 0;
  return ((totalTime - timeRemaining) / totalTime) * 100;
}
