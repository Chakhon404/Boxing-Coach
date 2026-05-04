import React from 'react';

export default function SettingsDrawer({
  isOpen,
  roundTime,
  speed,
  bpm,
  rhythmEnabled,
  onRoundTimeChange,
  onSpeedChange,
  onBpmChange,
  onRhythmToggle,
  isRunning,
}) {
  if (!isOpen) return null;

  return (
    <div className="bg-gym-card rounded-2xl border border-gray-700 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] p-5 transition-all duration-300 overflow-y-auto max-h-[60vh]">
      <div className="flex justify-between items-center mb-4">
        <span className="text-2xl text-gym-accent">Rhythm (BPM)</span>
        <input
          type="checkbox"
          checked={rhythmEnabled}
          onChange={(e) => onRhythmToggle(e.target.checked)}
          className="w-7 h-7"
          disabled={isRunning}
        />
      </div>

      <div className="mb-4">
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

      <hr className="border-gray-700 my-4" />

      <div className="mb-4">
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

      <div className="mb-2">
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
    </div>
  );
}
