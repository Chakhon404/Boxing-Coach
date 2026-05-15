import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Settings } from 'lucide-react';
import { useBoxingTimer } from './hooks/useBoxingTimer';
import { useComboEngine } from './hooks/useComboEngine.jsx';
import TimerDisplay from './components/TimerDisplay';
import ComboDisplay from './components/ComboDisplay';
import ControlPanel from './components/ControlPanel';
import SettingsPage from './components/SettingsPage';
import { playVoiceSFX, preloadAll } from './lib/audioEngine';

function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    const saved = localStorage.getItem(key);
    if (saved === null) return defaultValue;
    if (typeof defaultValue === 'boolean') return saved === 'true';
    if (typeof defaultValue === 'number') return Number(saved);
    return saved;
  });

  useEffect(() => {
    localStorage.setItem(key, String(value));
  }, [key, value]);

  return [value, setValue];
}

export default function App() {
  const [mode, setMode] = useLocalStorage('boxing_mode', 'boxing_basic');
  const [roundTime, setRoundTime] = useLocalStorage('boxing_time', 3);
  const [speed, setSpeed] = useLocalStorage('boxing_speed', 3000);
  const [bpm, setBpm] = useLocalStorage('boxing_bpm', 60);
  const [rhythmEnabled, setRhythmEnabled] = useLocalStorage('boxing_rhythm', true);
  const [totalRounds, setTotalRounds] = useLocalStorage('boxing_rounds', 3);
  const [restTime, setRestTime] = useLocalStorage('boxing_rest', 60);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [combo, setCombo] = useState('');
  const [formattedCombo, setFormattedCombo] = useState(null);
  const [flash, setFlash] = useState(false);
  const [soundsReady, setSoundsReady] = useState(false);
  const comboLoopRef = useRef(null);
  const isRunningRef = useRef(false);
  const statusRef = useRef('READY');

  const effectiveSpeed = mode === 'conditioning' ? 1500 : speed;

  useEffect(() => {
    preloadAll().then(() => setSoundsReady(true));
  }, []);

  const { timeLeft, status, isRunning, currentRound, totalRounds: tr, restTimeLeft, formatTime, startSession, stopRound } = useBoxingTimer({
    roundTime,
    speed: effectiveSpeed,
    bpm,
    rhythmEnabled,
    totalRounds,
    restTime,
  });

  const { generateCombo, formatComboColors, callCombo } = useComboEngine(mode);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const runComboLoop = useCallback(async () => {
    if (!isRunningRef.current || statusRef.current !== 'FIGHT') return;

    const comboText = generateCombo();
    setCombo(comboText);
    setFormattedCombo(formatComboColors(comboText));

    setFlash(true);
    setTimeout(() => setFlash(false), 150);

    await callCombo(comboText);

    if (isRunningRef.current && statusRef.current === 'FIGHT') {
      comboLoopRef.current = setTimeout(runComboLoop, effectiveSpeed);
    }
  }, [effectiveSpeed, generateCombo, formatComboColors, callCombo]);

  useEffect(() => {
    isRunningRef.current = isRunning;
    if (isRunning && status === 'FIGHT') {
      comboLoopRef.current = setTimeout(runComboLoop, 1000);
    } else {
      if (comboLoopRef.current) {
        clearTimeout(comboLoopRef.current);
        comboLoopRef.current = null;
      }
    }
    return () => {
      if (comboLoopRef.current) clearTimeout(comboLoopRef.current);
    };
  }, [isRunning, status, runComboLoop]);

  const handleStart = useCallback(() => {
    setSettingsOpen(false);
    setCombo('');
    setFormattedCombo(null);
    startSession();
  }, [startSession]);

  const handleStop = useCallback(() => {
    stopRound();
    if (statusRef.current !== 'COMPLETE') {
      playVoiceSFX('GOOD_JOB');
      setCombo('GOOD JOB');
      setFormattedCombo(null);
    }
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
      <header className="fixed top-0 left-0 right-0 z-40 bg-gym-black border-b border-gray-700 p-4 flex justify-end">
        <button
          onClick={() => setSettingsOpen(true)}
          className="p-2 text-gray-400 hover:text-white transition-colors"
          disabled={isRunning}
        >
          <Settings size={28} />
        </button>
      </header>

      <div className="flex-1 flex flex-col justify-between p-5 pt-20 max-w-3xl mx-auto w-full">
        <div className="flex-1 flex flex-col justify-center">
          <TimerDisplay
            timeFormatted={formatTime(timeLeft)}
            status={status}
            currentRound={currentRound}
            totalRounds={totalRounds}
            restTimeLeft={restTimeLeft}
            formatTime={formatTime}
          />
          <ComboDisplay combo={combo} formattedCombo={formattedCombo} flash={flash} />
        </div>

        <div className="flex-shrink-0">
          <ControlPanel
            isRunning={isRunning}
            isDisabled={status === 'GET READY'}
            onStart={handleStart}
            onStop={handleStop}
          />
        </div>
      </div>

      <SettingsPage
        isOpen={settingsOpen}
        mode={mode}
        roundTime={roundTime}
        speed={speed}
        bpm={bpm}
        rhythmEnabled={rhythmEnabled}
        totalRounds={totalRounds}
        restTime={restTime}
        onModeChange={setMode}
        onRoundTimeChange={setRoundTime}
        onSpeedChange={setSpeed}
        onBpmChange={setBpm}
        onRhythmToggle={setRhythmEnabled}
        onTotalRoundsChange={setTotalRounds}
        onRestTimeChange={setRestTime}
        onClose={() => setSettingsOpen(false)}
        isRunning={isRunning}
      />
    </div>
  );
}
