import React from 'react';
import { Play, Square, Settings } from 'lucide-react';

export default function ControlPanel({ isRunning, isDisabled, onStart, onStop, onToggleSettings, settingsOpen }) {
  return (
    <footer className="w-full flex flex-col justify-end gap-3 mb-3">
      <button
        onClick={isRunning ? onStop : onStart}
        disabled={isDisabled}
        className={`w-full h-[30vh] max-h-96 rounded-3xl text-5xl font-bold uppercase transition-all duration-200 active:scale-[0.96] flex items-center justify-center gap-4 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed ${
          isRunning
            ? 'bg-gym-danger text-white shadow-[0_0_30px_rgba(255,42,42,0.5)]'
            : 'bg-gym-primary text-black shadow-[0_0_30px_rgba(0,255,136,0.5)]'
        }`}
      >
        {isRunning ? (
          <>
            <Square size={48} fill="currentColor" /> STOP
          </>
        ) : isDisabled ? (
          'GET READY...'
        ) : (
          <>
            <Play size={48} fill="currentColor" /> START ROUND
          </>
        )}
      </button>

      <button
        onClick={onToggleSettings}
        className="w-full py-3 text-xl bg-transparent text-gray-500 border-2 border-gray-700 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98]"
      >
        <Settings size={24} className={`transition-transform duration-300 ${settingsOpen ? 'rotate-180' : ''}`} />
        {settingsOpen ? 'HIDE' : 'SETTINGS'}
      </button>
    </footer>
  );
}
