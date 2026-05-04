import { useCallback } from 'react';
import { playCombo } from '../lib/audioEngine';

const transitions = {
  'START': ['1-1', '1 body-2', 'slip-left', 'slip-right', 'roll-under', '1 2 3', 'drop'],
  '1': ['2', 'slip-left', 'roll-under', 'body-2', '5'],
  '1-1': ['2', 'body-2', 'drop', 'pivot'],
  '2': ['3', 'roll-under', 'body-3', 'slip-right', 'pivot'],
  'body-2': ['6', '4', '3', 'roll-under'],
  'body-3': ['5', '3', '2', 'pivot', 'roll-under'],
  '3': ['body-3', '2', 'roll-under', '5'],
  '4': ['3', 'roll-under', 'body-3'],
  '5': ['4', '3', 'body-3'],
  '6': ['3', '4', 'roll-under'],
  'slip-left':  ['5', '3', 'body-3', 'pivot'],
  'slip-right': ['6', '2', 'body-2'],
  'roll-under': ['3 2', '5 4', '6 3', 'body-3', 'pivot'],
  'weave':      ['3', '2'],
  'pivot':      ['2', '6', '1 2'],
  'drop':       ['5', '6', '3']
};

export function useComboEngine() {
  const generateCombo = useCallback(() => {
    const combo = [];
    let currentMove = 'START';
    const actualLength = Math.random() < 0.7 ? (Math.floor(Math.random() * 2) + 2) : 4;

    for (let i = 0; i < actualLength; i++) {
      const possibleMoves = transitions[currentMove] || transitions['START'];
      const nextMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];

      if (nextMove !== 'START') combo.push(nextMove);

      if (nextMove.includes(' ') && !nextMove.includes('-')) {
        const parts = nextMove.split(' ');
        currentMove = parts[parts.length - 1];
      } else {
        currentMove = nextMove;
      }
    }
    return combo.join(' ');
  }, []);

  const formatComboColors = useCallback((text) => {
    const elements = text.split(' ').map((word, idx) => {
      const lower = word.toLowerCase();
      let colorClass = 'text-white';
      if (['slip', 'roll', 'weave', 'pivot', 'drop'].some(x => lower.includes(x))) {
        colorClass = 'text-gym-warning';
      } else if (lower.includes('body')) {
        colorClass = 'text-gym-accent';
      }
      const displayText = word.replace(/-/g, ' ');
      return { key: idx, text: displayText, colorClass };
    });

    const result = [];
    elements.forEach((el, i) => {
      if (i > 0) result.push(' ');
      result.push(<span key={el.key} className={el.colorClass}>{el.text}</span>);
    });
    return result;
  }, []);

  const callCombo = useCallback(async (comboText) => {
    await playCombo(comboText);
  }, []);

  return { generateCombo, formatComboColors, callCombo };
}
