import { useRef, useCallback, useEffect } from "react";

export function useAudio(audioEnabled: boolean) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      speechSynthesisRef.current = window.speechSynthesis;
    }
  }, []);

  const initAudio = useCallback(() => {
    if (!audioEnabled) return;
    
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, [audioEnabled]);

  const playBeep = useCallback((frequency = 800, duration = 200) => {
    if (!audioEnabled || !audioContextRef.current) return;
    
    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration / 1000);
      
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + duration / 1000);
    } catch (error) {
      console.warn('Audio playback failed:', error);
    }
  }, [audioEnabled]);

  const playPulse = useCallback(() => {
    if (!audioEnabled) return;
    playBeep(1000, 100);
  }, [audioEnabled, playBeep]);

  const speak = useCallback((text: string) => {
    if (!audioEnabled || !speechSynthesisRef.current) return;
    
    try {
      speechSynthesisRef.current.cancel(); // Cancel any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.2;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      speechSynthesisRef.current.speak(utterance);
    } catch (error) {
      console.warn('Speech synthesis failed:', error);
    }
  }, [audioEnabled]);

  return {
    initAudio,
    playBeep,
    playPulse,
    speak,
  };
}
