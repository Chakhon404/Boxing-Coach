import { useState, useEffect, useRef, useCallback } from 'react';
import { playTick, playBellStart, playBellEnd, playCountdown, playVoiceSFX, stopAllAudio } from '../lib/audioEngine';

export function useBoxingTimer({ roundTime, speed, bpm, rhythmEnabled, totalRounds, restTime }) {
  // 1. State variables
  const [timeLeft, setTimeLeft] = useState(roundTime * 60);
  const [status, setStatus] = useState('READY');
  const [isRunning, setIsRunning] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [restTimeLeft, setRestTimeLeft] = useState(0);

  // 2. Refs for intervals
  const timerRef = useRef(null);
  const rhythmRef = useRef(null);
  const countdownRef = useRef(null);
  const restRef = useRef(null);
  const wakeLockRef = useRef(null);

  // 3. Refs to avoid stale closures
  const currentRoundRef = useRef(currentRound);
  const statusRef = useRef(status);
  const startFightRoundRef = useRef(null);
  const startCountdownRef = useRef(null);

  // 4. Sync state to refs
  useEffect(() => {
    currentRoundRef.current = currentRound;
  }, [currentRound]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // 5. Utility functions
  const formatTime = useCallback((seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }, []);

  const requestWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      }
    } catch (e) {}
  }, []);

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
  }, []);

  // Clear ALL intervals — called before any state transition
  const clearAllIntervals = useCallback(() => {
    clearInterval(timerRef.current);
    clearInterval(countdownRef.current);
    clearInterval(restRef.current);
    clearInterval(rhythmRef.current);
    timerRef.current = null;
    countdownRef.current = null;
    restRef.current = null;
    rhythmRef.current = null;
  }, []);

  const startRhythm = useCallback(() => {
    if (!rhythmEnabled) return;
    playTick();
    const intervalMs = 60000 / bpm;
    rhythmRef.current = setInterval(() => playTick(), intervalMs);
  }, [bpm, rhythmEnabled]);

  const stopRhythm = useCallback(() => {
    clearInterval(rhythmRef.current);
    rhythmRef.current = null;
  }, []);

  // Start 5-second GET READY countdown, then call onComplete
  const startCountdown = useCallback((onComplete) => {
    clearInterval(countdownRef.current);
    setIsCountingDown(true);
    setStatus('GET READY');
    playVoiceSFX('GET_READY');
    let prep = 5;

    const tick = () => {
      prep--;
      if (prep > 0) {
        playCountdown();
      } else {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
        setIsCountingDown(false);
        onComplete();
      }
    };

    countdownRef.current = setInterval(tick, 1000);
  }, []);

  // Start a WORK round
  const startFightRound = useCallback(() => {
    clearAllIntervals();
    stopRhythm();

    setStatus('FIGHT');
    playBellStart();
    setTimeLeft(roundTime * 60);
    startRhythm();

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          stopRhythm();
          playBellEnd();

          const nextRound = currentRoundRef.current + 1;

          if (currentRoundRef.current < totalRounds) {
            setStatus('REST');
            setRestTimeLeft(restTime);
          } else {
            playVoiceSFX('GOOD_JOB');
            releaseWakeLock();
            setStatus('COMPLETE');
            setIsRunning(false);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [roundTime, startRhythm, stopRhythm, releaseWakeLock, totalRounds, restTime, clearAllIntervals]);

  // Handle REST period countdown
  const startRestPeriod = useCallback(() => {
    clearInterval(restRef.current);

    restRef.current = setInterval(() => {
      setRestTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(restRef.current);
          restRef.current = null;
          // Increment round, then start countdown for next round
          setCurrentRound(prevRound => prevRound + 1);
          // Start GET READY countdown, then fight round
          startCountdown(() => startFightRound());
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [startCountdown, startFightRound]);

  const stopRound = useCallback(() => {
    clearAllIntervals();
    stopRhythm();
    stopAllAudio();
    releaseWakeLock();
    window.speechSynthesis?.cancel();

    setIsRunning(false);
    setIsCountingDown(false);
    setStatus('READY');
    setCurrentRound(1);
    setRestTimeLeft(0);
    setTimeLeft(roundTime * 60);
  }, [roundTime, stopRhythm, releaseWakeLock, clearAllIntervals]);

  const startSession = useCallback(() => {
    clearAllIntervals();
    stopAllAudio();

    setIsRunning(true);
    setCurrentRound(1);
    requestWakeLock();
    // Start GET READY countdown, then fight round
    startCountdown(() => startFightRound());
  }, [requestWakeLock, startCountdown, startFightRound, clearAllIntervals]);

  // 6. Set function refs AFTER functions are defined
  useEffect(() => {
    startFightRoundRef.current = startFightRound;
  }, [startFightRound]);

  useEffect(() => {
    startCountdownRef.current = startCountdown;
  }, [startCountdown]);

  // 7. Trigger rest period when status changes to REST
  useEffect(() => {
    if (status === 'REST') {
      startRestPeriod();
    }
    return () => {
      if (status === 'REST') {
        clearInterval(restRef.current);
      }
    };
  }, [status, startRestPeriod]);

  // 8. Reset timeLeft when roundTime changes (only when idle)
  useEffect(() => {
    if (!isRunning && !isCountingDown && status !== 'REST') {
      setTimeLeft(roundTime * 60);
      setCurrentRound(1);
      setRestTimeLeft(0);
    }
  }, [roundTime, isRunning, isCountingDown, status]);

  // 9. Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllIntervals();
      stopAllAudio();
      releaseWakeLock();
    };
  }, [clearAllIntervals, releaseWakeLock]);

  return {
    timeLeft,
    status,
    isRunning,
    isCountingDown,
    currentRound,
    totalRounds,
    restTimeLeft,
    formatTime,
    startSession,
    stopRound,
  };
}
