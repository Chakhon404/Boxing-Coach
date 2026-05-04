import { useState, useEffect, useRef, useCallback } from 'react';
import { playTick, playBellStart, playBellEnd, playCountdown, playVoiceSFX } from '../lib/audioEngine';

export function useBoxingTimer({ roundTime, speed, bpm, rhythmEnabled }) {
  const [timeLeft, setTimeLeft] = useState(roundTime * 60);
  const [status, setStatus] = useState('READY');
  const [isRunning, setIsRunning] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const timerRef = useRef(null);
  const rhythmRef = useRef(null);
  const countdownRef = useRef(null);
  const wakeLockRef = useRef(null);

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

  useEffect(() => {
    if (!isRunning && !isCountingDown) {
      setTimeLeft(roundTime * 60);
    }
  }, [roundTime, isRunning, isCountingDown]);

  const startRhythm = useCallback(() => {
    if (!rhythmEnabled) return;
    playTick();
    const intervalMs = 60000 / bpm;
    rhythmRef.current = setInterval(() => playTick(), intervalMs);
  }, [bpm, rhythmEnabled]);

  const stopRhythm = useCallback(() => {
    clearInterval(rhythmRef.current);
  }, []);

  const startRound = useCallback(() => {
    setIsRunning(true);
    setStatus('FIGHT');
    playBellStart();
    requestWakeLock();
    setTimeLeft(roundTime * 60);
    startRhythm();

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          stopRhythm();
          releaseWakeLock();
          playBellEnd();
          setStatus('REST');
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [roundTime, startRhythm, stopRhythm, requestWakeLock, releaseWakeLock]);

  const stopRound = useCallback(() => {
    clearInterval(timerRef.current);
    clearInterval(countdownRef.current);
    stopRhythm();
    releaseWakeLock();
    window.speechSynthesis?.cancel();
    setIsRunning(false);
    setIsCountingDown(false);
    setStatus('REST');
    setTimeLeft(roundTime * 60);
  }, [roundTime, stopRhythm, releaseWakeLock]);

  const formatTime = useCallback((seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }, []);

  const startCountdown = useCallback((onComplete) => {
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
        setIsCountingDown(false);
        onComplete();
      }
    };

    countdownRef.current = setInterval(tick, 1000);
    return countdownRef.current;
  }, []);

  return {
    timeLeft,
    status,
    isRunning,
    isCountingDown,
    formatTime,
    startRound,
    stopRound,
    startCountdown,
  };
}
