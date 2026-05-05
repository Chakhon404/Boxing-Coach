import React from 'react';
import { X } from 'lucide-react';

export default function SettingsPage({
  isOpen,
  roundTime,
  speed,
  bpm,
  rhythmEnabled,
  totalRounds,
  restTime,
  onRoundTimeChange,
  onSpeedChange,
  onBpmChange,
  onRhythmToggle,
  onTotalRoundsChange,
  onRestTimeChange,
  onClose,
  isRunning,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gym-black overflow-y-auto">
      <div className="max-w-3xl mx-auto w-full p-5">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl text-gym-accent font-bold tracking-widest">SETTINGS</h1>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X size={32} />
          </button>
        </div>

        <div className="bg-gym-card rounded-2xl border border-gray-700 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] p-5 space-y-6">
          <div>
            <label className="block text-xl text-gray-400 mb-1">
              Round Time: <span className="text-gym-primary font-bold">{roundTime}</span> min
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={roundTime}
              onChange={(e) => onRoundTimeChange(Number(e.target.value))}
              className="w-full h-8"
              disabled={isRunning}
            />
          </div>

          <div>
            <label className="block text-xl text-gray-400 mb-1">
              Call Speed: <span className="text-gym-primary font-bold">{(speed / 1000).toFixed(1)}</span> sec
            </label>
            <input
              type="range"
              min="1500"
              max="6000"
              step="500"
              value={speed}
              onChange={(e) => onSpeedChange(Number(e.target.value))}
              className="w-full h-8"
              disabled={isRunning}
            />
          </div>

          <hr className="border-gray-700" />

          <div>
            <label className="block text-xl text-gray-400 mb-1">
              Total Rounds: <span className="text-gym-primary font-bold">{totalRounds}</span>
            </label>
            <input
              type="range"
              min="1"
              max="12"
              value={totalRounds}
              onChange={(e) => onTotalRoundsChange(Number(e.target.value))}
              className="w-full h-8"
              disabled={isRunning}
            />
          </div>

          <div>
            <label className="block text-xl text-gray-400 mb-1">
              Rest Time: <span className="text-gym-primary font-bold">{restTime}</span> sec
            </label>
            <input
              type="range"
              min="1"
              max="180"
              value={restTime}
              onChange={(e) => onRestTimeChange(Number(e.target.value))}
              className="w-full h-8"
              disabled={isRunning}
            />
          </div>

          <hr className="border-gray-700" />

          <div className="flex justify-between items-center">
            <span className="text-2xl text-gym-accent">Rhythm (BPM)</span>
            <input
              type="checkbox"
              checked={rhythmEnabled}
              onChange={(e) => onRhythmToggle(e.target.checked)}
              className="w-7 h-7"
              disabled={isRunning}
            />
          </div>

          <div>
            <label className="block text-xl text-gray-400 mb-1">
              Head Bob Speed: <span className="text-gym-primary font-bold">{bpm}</span> BPM
            </label>
            <input
              type="range"
              min="40"
              max="120"
              step="5"
              value={bpm}
              onChange={(e) => onBpmChange(Number(e.target.value))}
              className="w-full h-8"
              disabled={isRunning}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
