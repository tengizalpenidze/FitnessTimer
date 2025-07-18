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

  // Initialize audio context with comprehensive diagnostics
  const initializeAudio = useCallback(async () => {
    console.log('🎵 Initializing audio system...');
    
    try {
      // Test browser audio support
      console.log('Browser support checks:');
      console.log('- AudioContext:', !!(window.AudioContext || (window as any).webkitAudioContext));
      console.log('- Speech Synthesis:', 'speechSynthesis' in window);
      console.log('- HTML5 Audio:', !!window.Audio);
      
      // Initialize audio context
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioContextRef.current = new AudioContextClass();
          console.log('✅ AudioContext created, state:', audioContextRef.current.state);
        } else {
          console.log('❌ AudioContext not supported');
          return;
        }
      }
      
      // Resume audio context if suspended
      if (audioContextRef.current.state === 'suspended') {
        console.log('🔄 Resuming suspended audio context...');
        await audioContextRef.current.resume();
        console.log('✅ Audio context resumed, state:', audioContextRef.current.state);
      }
      
      // Test a simple beep to verify audio works
      if (audioContextRef.current.state === 'running') {
        console.log('🔊 Testing audio with simple beep...');
        const testOscillator = audioContextRef.current.createOscillator();
        const testGain = audioContextRef.current.createGain();
        
        testOscillator.connect(testGain);
        testGain.connect(audioContextRef.current.destination);
        
        testOscillator.frequency.setValueAtTime(800, audioContextRef.current.currentTime);
        testOscillator.type = 'sine';
        
        testGain.gain.setValueAtTime(0, audioContextRef.current.currentTime);
        testGain.gain.linearRampToValueAtTime(0.3, audioContextRef.current.currentTime + 0.01);
        testGain.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + 0.1);
        
        testOscillator.start(audioContextRef.current.currentTime);
        testOscillator.stop(audioContextRef.current.currentTime + 0.1);
        
        console.log('✅ Test beep sent to audio destination');
      }
      
      setAudioInitialized(true);
      console.log('✅ Audio system initialization complete');
      
    } catch (error) {
      console.log('❌ Audio initialization failed:', error);
      setAudioInitialized(false);
    }
  }, []);

  // Audio functions - Multi-method beep system for maximum reliability
  const playBeep = useCallback(async () => {
    if (!settings.audioEnabled) return;
    
    try {
      // Method 1: Try Web Audio API (most reliable)
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      if (audioContextRef.current.state === 'interrupted') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        await audioContextRef.current.resume();
      }
      
      if (audioContextRef.current.state === 'running') {
        const playTone = (frequency: number, startTime: number, duration: number) => {
          const oscillator = audioContextRef.current!.createOscillator();
          const gainNode = audioContextRef.current!.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContextRef.current!.destination);
          
          oscillator.frequency.setValueAtTime(frequency, startTime);
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(0.6, startTime + 0.02);
          gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
          
          oscillator.start(startTime);
          oscillator.stop(startTime + duration);
        };
        
        const now = audioContextRef.current.currentTime;
        playTone(1000, now, 0.1);        // High beep
        playTone(800, now + 0.12, 0.1);  // Lower beep
        
        console.log('✅ Web Audio double-beep played successfully');
        return;
      }
      
      console.log('⚠️ Web Audio API not running, trying fallback methods...');
      
      // Method 2: HTML5 Audio with data URL fallback
      try {
        console.log('🔄 Trying HTML5 Audio fallback...');
        const beepDataUrl = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMeAz2M0/LLeSsFJXfD7N2UQwoUW7Pp68hLFfI=";
        
        const audio = new Audio(beepDataUrl);
        audio.volume = 0.8;
        
        // Check if audio can load
        audio.addEventListener('canplaythrough', () => {
          console.log('✅ HTML5 Audio loaded successfully');
        });
        
        audio.addEventListener('error', (e) => {
          console.log('❌ HTML5 Audio error:', e);
        });
        
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          await playPromise;
          console.log('✅ HTML5 Audio beep played successfully');
        }
        return;
      } catch (audioError) {
        console.log('❌ HTML5 Audio failed:', audioError);
      }
      
      // Method 3: Programmatic buffer generation
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const buffer = context.createBuffer(1, context.sampleRate * 0.2, context.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < data.length; i++) {
        const t = i / context.sampleRate;
        if (t < 0.1) {
          data[i] = Math.sin(1200 * 2 * Math.PI * t) * Math.exp(-t * 20) * 0.7;
        } else if (t > 0.12 && t < 0.2) {
          data[i] = Math.sin(800 * 2 * Math.PI * (t - 0.12)) * Math.exp(-(t - 0.12) * 20) * 0.7;
        }
      }
      
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      source.start();
      
      console.log('Buffer generation beep played');
      
    } catch (error) {
      console.log('All beep methods failed:', error);
    }
  }, [settings.audioEnabled]);

  const speak = useCallback((text: string) => {
    if (!settings.audioEnabled) return;
    
    try {
      if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        speechSynthesis.cancel();
        
        // Wait a brief moment for cancellation to complete
        setTimeout(() => {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 1.2;
          utterance.volume = 0.9;
          utterance.pitch = 1;
          utterance.lang = 'en-US';
          
          // Error handling for speech synthesis
          utterance.onerror = (event) => {
            console.log('Speech synthesis error:', event.error);
          };
          
          utterance.onend = () => {
            console.log('Speech completed:', text);
          };
          
          speechSynthesis.speak(utterance);
          console.log('Speaking:', text);
        }, 50);
      } else {
        console.log('Speech synthesis not supported');
      }
    } catch (error) {
      console.log('Speech synthesis failed:', error);
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

        {/* Audio Debug Controls */}
        <div className="border border-gray-600 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3 text-white">Audio Test Controls</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            <SimpleButton 
              onClick={async () => {
                console.log('=== LOUD BEEP TEST START ===');
                // Create a very loud, obvious beep
                try {
                  const ctx = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
                  if (ctx.state === 'suspended') await ctx.resume();
                  
                  const osc = ctx.createOscillator();
                  const gain = ctx.createGain();
                  
                  osc.connect(gain);
                  gain.connect(ctx.destination);
                  
                  osc.frequency.setValueAtTime(1000, ctx.currentTime);
                  osc.type = 'square'; // Harsher sound
                  
                  gain.gain.setValueAtTime(0, ctx.currentTime);
                  gain.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 0.05); // Very loud
                  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
                  
                  osc.start(ctx.currentTime);
                  osc.stop(ctx.currentTime + 0.5);
                  
                  console.log('✅ LOUD beep sent - should be very audible');
                } catch (e) {
                  console.log('❌ Loud beep failed:', e);
                }
              }} 
              variant="secondary" 
              size="sm"
            >
              🔊 LOUD Test
            </SimpleButton>
            <SimpleButton 
              onClick={async () => {
                console.log('=== FREQUENCY SWEEP TEST ===');
                try {
                  const ctx = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
                  if (ctx.state === 'suspended') await ctx.resume();
                  
                  const osc = ctx.createOscillator();
                  const gain = ctx.createGain();
                  
                  osc.connect(gain);
                  gain.connect(ctx.destination);
                  
                  // Sweep from 200Hz to 2000Hz
                  osc.frequency.setValueAtTime(200, ctx.currentTime);
                  osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 2);
                  osc.type = 'sawtooth';
                  
                  gain.gain.setValueAtTime(0.7, ctx.currentTime);
                  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
                  
                  osc.start(ctx.currentTime);
                  osc.stop(ctx.currentTime + 2);
                  
                  console.log('✅ Frequency sweep sent - should hear rising tone');
                } catch (e) {
                  console.log('❌ Frequency sweep failed:', e);
                }
              }} 
              variant="secondary" 
              size="sm"
            >
              🎵 Freq Sweep
            </SimpleButton>
            <SimpleButton 
              onClick={async () => {
                console.log('=== HTML5 AUDIO TEST ===');
                try {
                  // Create a simple click sound
                  const audio = new Audio();
                  audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMeAz2M0/LLeSsFJXfD7N2UQwoUW7Pp68hLFfI=';
                  audio.volume = 1.0; // Maximum volume
                  
                  // Force load and play
                  audio.load();
                  const playPromise = audio.play();
                  if (playPromise) {
                    await playPromise;
                    console.log('✅ HTML5 audio should have played');
                  }
                } catch (e) {
                  console.log('❌ HTML5 audio failed:', e);
                }
              }} 
              variant="secondary" 
              size="sm"
            >
              🎯 HTML5 Test
            </SimpleButton>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            <SimpleButton 
              onClick={() => {
                console.log('=== VOICE VOLUME TEST ===');
                if ('speechSynthesis' in window) {
                  speechSynthesis.cancel();
                  setTimeout(() => {
                    const utterance = new SpeechSynthesisUtterance('LOUD TEST VOICE ANNOUNCEMENT');
                    utterance.rate = 0.8;
                    utterance.volume = 1.0; // Maximum volume
                    utterance.pitch = 1.0;
                    utterance.lang = 'en-US';
                    
                    utterance.onstart = () => console.log('✅ Speech started');
                    utterance.onend = () => console.log('✅ Speech ended');
                    utterance.onerror = (e) => console.log('❌ Speech error:', e);
                    
                    speechSynthesis.speak(utterance);
                  }, 100);
                }
              }} 
              variant="secondary" 
              size="sm"
            >
              🗣️ LOUD Voice
            </SimpleButton>
            <SimpleButton 
              onClick={async () => {
                console.log('=== SYSTEM AUDIO CHECK ===');
                console.log('Audio context state:', audioContextRef.current?.state);
                console.log('Audio context sample rate:', audioContextRef.current?.sampleRate);
                console.log('Audio context destination:', audioContextRef.current?.destination);
                console.log('Navigator media devices:', !!navigator.mediaDevices);
                console.log('Speech synthesis voices:', speechSynthesis?.getVoices?.()?.length || 0);
                
                // Check system volume capability
                if (audioContextRef.current) {
                  const analyser = audioContextRef.current.createAnalyser();
                  console.log('Audio analyser created:', !!analyser);
                }
              }} 
              variant="secondary" 
              size="sm"
            >
              🔍 System Check
            </SimpleButton>
          </div>
          <div className="text-sm text-gray-400">
            <div>Audio Status: {audioInitialized ? '✅ Ready' : '❌ Not Ready'}</div>
            <div>Audio Context: {audioContextRef.current?.state || 'None'}</div>
            <div>Speech Synthesis: {'speechSynthesis' in window ? '✅ Available' : '❌ Not Available'}</div>
            <div>Audio Enabled: {settings.audioEnabled ? '✅ Yes' : '❌ No'}</div>
            <div>Browser: {navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                         navigator.userAgent.includes('Firefox') ? 'Firefox' : 
                         navigator.userAgent.includes('Safari') ? 'Safari' : 'Other'}</div>
            <div>Sample Rate: {audioContextRef.current?.sampleRate || 'Unknown'} Hz</div>
          </div>
          <div className="mt-3 p-3 bg-gray-800 rounded text-xs text-yellow-300">
            <strong>Troubleshooting:</strong><br/>
            • Try "LOUD Test" first - if no sound, check system volume<br/>
            • "Freq Sweep" should play a rising tone for 2 seconds<br/>
            • "HTML5 Test" uses different audio method<br/>
            • Try different browser (Chrome usually works best)<br/>
            • Check if other websites play audio<br/>
            • Some browsers need interaction before audio works
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