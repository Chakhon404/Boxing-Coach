import React from 'react';

export default function ComboDisplay({ combo, formattedCombo, flash }) {
  return (
    <main className="flex items-center justify-center my-4 md:my-8">
      <div
        className={`text-6xl md:text-8xl text-center uppercase leading-tight font-bold px-4 ${flash ? 'animate-flash rounded-lg' : ''}`}
      >
        {formattedCombo || combo || 'TAP START'}
      </div>
    </main>
  );
}
