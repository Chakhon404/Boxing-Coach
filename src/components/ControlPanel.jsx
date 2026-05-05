import React from 'react';
import { Play, Square } from 'lucide-react';

export default function ControlPanel({ isRunning, isDisabled, onStart, onStop }) {
  return (
    <footer className="w-full flex flex-col justify-end gap-3 mb-3">
      <button
        onClick={isRunning ? onStop : onStart}
        disabled={isDisabled}
        className={`w-full h-[20vh] max-h-64 rounded-3xl text-4xl font-bold uppercase transition-all duration-200 active:scale-[0.96] flex items-center justify-center gap-4 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed ${
          isRunning
            ? 'bg-gym-danger text-white shadow-[0_0_30px_rgba(255,42,42,0.5)]'
            : 'bg-gym-primary text-black shadow-[0_0_30px_rgba(0,255,136,0.5)]'
        }`}
      >
        {isRunning ? (
          <>
            <Square size={40} fill="currentColor" /> STOP
          </>
        ) : isDisabled ? (
          'GET READY...'
        ) : (
          <>
            <Play size={40} fill="currentColor" /> START ROUND
          </>
        )}
      </button>
    </footer>
  );
}
