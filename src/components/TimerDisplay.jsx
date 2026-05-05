import React from 'react';

const STATUS_COLORS = {
  READY: 'text-gray-500',
  'GET READY': 'text-gym-warning',
  FIGHT: 'text-gym-danger',
  REST: 'text-gym-accent',
  COMPLETE: 'text-gym-primary',
};

export default function TimerDisplay({ timeFormatted, status, currentRound, totalRounds, restTimeLeft, formatTime }) {
  return (
    <header className="text-center">
      {status === 'FIGHT' && (
        <div className="text-lg text-gym-accent tracking-widest mb-1">
          ROUND {currentRound}/{totalRounds}
        </div>
      )}
      {status === 'REST' && (
        <div className="text-lg text-gym-accent tracking-widest mb-1">
          REST: {formatTime(restTimeLeft)}
        </div>
      )}
      <div className="text-7xl md:text-8xl font-bold text-gym-primary tabular-nums leading-none drop-shadow-[0_0_20px_rgba(0,255,136,0.3)]">
        {timeFormatted}
      </div>
      <div className={`text-2xl tracking-widest mt-2 ${STATUS_COLORS[status] || 'text-gray-500'}`}>
        {status}
      </div>
    </header>
  );
}
