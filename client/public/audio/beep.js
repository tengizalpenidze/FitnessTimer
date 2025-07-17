// Audio data URL for beep sound as base64 encoded WAV
// This provides a fallback when Web Audio API fails
export const BEEP_DATA_URL = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMeAz2M0/LLeSsFJXfD7N2UQwoUW7Pp68hLFfI=";

// Create audio buffer for reliable beep playback
export function createBeepAudio() {
  try {
    const audio = new Audio(BEEP_DATA_URL);
    audio.preload = 'auto';
    audio.volume = 0.6;
    return audio;
  } catch (error) {
    console.warn('Failed to create audio element:', error);
    return null;
  }
}

// Play beep using HTML5 Audio as fallback
export function playBeepAudio() {
  try {
    const audio = createBeepAudio();
    if (audio) {
      audio.currentTime = 0;
      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch(e => console.warn('Audio play failed:', e));
      }
      return true;
    }
  } catch (error) {
    console.warn('Beep audio fallback failed:', error);
  }
  return false;
}