import React from 'react';

const STATUS_COLORS = {
  READY: 'text-gray-500',
  'GET READY': 'text-gym-warning',
  FIGHT: 'text-gym-danger',
  REST: 'text-gray-500',
};

export default function TimerDisplay({ timeFormatted, status }) {
  return (
    <header className="text-center">
      <div className="text-7xl md:text-8xl font-bold text-gym-primary tabular-nums leading-none drop-shadow-[0_0_20px_rgba(0,255,136,0.3)]">
        {timeFormatted}
      </div>
      <div className={`text-2xl tracking-widest mt-2 ${STATUS_COLORS[status] || 'text-gray-500'}`}>
        {status}
      </div>
    </header>
  );
}
