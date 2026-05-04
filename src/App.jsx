import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useBoxingTimer } from './hooks/useBoxingTimer';
import { useComboEngine } from './hooks/useComboEngine.jsx';
import TimerDisplay from './components/TimerDisplay';
import ComboDisplay from './components/ComboDisplay';
import ControlPanel from './components/ControlPanel';
import SettingsDrawer from './components/SettingsDrawer';
import { playVoiceSFX, preloadAll } from './lib/audioEngine';

function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    const saved = localStorage.getItem(key);
    return saved !== null ? (typeof defaultValue === 'boolean' ? saved === 'true' : Number(saved)) : defaultValue;
  });

  useEffect(() => {
    localStorage.setItem(key, String(value));
  }, [key, value]);

  return [value, setValue];
}

export default function App() {
  const [roundTime, setRoundTime] = useLocalStorage('boxing_time', 3);
  const [speed, setSpeed] = useLocalStorage('boxing_speed', 3000);
  const [bpm, setBpm] = useLocalStorage('boxing_bpm', 60);
  const [rhythmEnabled, setRhythmEnabled] = useLocalStorage('boxing_rhythm', true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [combo, setCombo] = useState('');
  const [formattedCombo, setFormattedCombo] = useState(null);
  const [flash, setFlash] = useState(false);
  const [soundsReady, setSoundsReady] = useState(false);
  const comboLoopRef = useRef(null);
  const isRunningRef = useRef(false);

  useEffect(() => {
    preloadAll().then(() => setSoundsReady(true));
  }, []);

  const { timeLeft, status, isRunning, formatTime, startRound, stopRound, startCountdown } = useBoxingTimer({
    roundTime,
    speed,
    bpm,
    rhythmEnabled,
  });

  const { generateCombo, formatComboColors, callCombo } = useComboEngine();

  const runComboLoop = useCallback(async () => {
    if (!isRunningRef.current) return;

    const comboText = generateCombo();
    setCombo(comboText);
    setFormattedCombo(formatComboColors(comboText));

    setFlash(true);
    setTimeout(() => setFlash(false), 150);

    await callCombo(comboText);

    if (isRunningRef.current) {
      comboLoopRef.current = setTimeout(runComboLoop, speed);
    }
  }, [speed, generateCombo, formatComboColors, callCombo]);

  useEffect(() => {
    isRunningRef.current = isRunning;
    if (isRunning) {
      comboLoopRef.current = setTimeout(runComboLoop, 1000);
    }
    return () => {
      if (comboLoopRef.current) clearTimeout(comboLoopRef.current);
    };
  }, [isRunning, runComboLoop]);

  const handleStart = useCallback(() => {
    setSettingsOpen(false);
    setCombo('');
    setFormattedCombo(null);

    startCountdown(() => {
      startRound();
    });
  }, [startCountdown, startRound]);

  const handleStop = useCallback(() => {
    stopRound();
    playVoiceSFX('GOOD_JOB');
    setCombo('GOOD JOB');
    setFormattedCombo(null);
  }, [stopRound]);

  if (!soundsReady) {
    return (
      <div className="bg-gym-black text-white h-screen overflow-hidden flex flex-col items-center justify-center">
        <div className="text-6xl font-bold text-gym-primary animate-pulse">
          LOADING SOUNDS...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gym-black text-white h-screen overflow-hidden flex flex-col">
      <div className="flex-1 flex flex-col justify-between p-5 max-w-3xl mx-auto w-full">
        <div className="flex-1 flex flex-col justify-center">
          <TimerDisplay timeFormatted={formatTime(timeLeft)} status={status} />
          <ComboDisplay combo={combo} formattedCombo={formattedCombo} flash={flash} />
        </div>

        <div className="flex-shrink-0">
          <ControlPanel
            isRunning={isRunning}
            isDisabled={status === 'GET READY'}
            onStart={handleStart}
            onStop={handleStop}
            onToggleSettings={() => setSettingsOpen(!settingsOpen)}
            settingsOpen={settingsOpen}
          />
          <SettingsDrawer
            isOpen={settingsOpen}
            roundTime={roundTime}
            speed={speed}
            bpm={bpm}
            rhythmEnabled={rhythmEnabled}
            onRoundTimeChange={setRoundTime}
            onSpeedChange={setSpeed}
            onBpmChange={setBpm}
            onRhythmToggle={setRhythmEnabled}
            isRunning={isRunning}
          />
        </div>
      </div>
    </div>
  );
}
