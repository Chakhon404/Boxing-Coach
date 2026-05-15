import { useCallback } from 'react';
import { playCombo } from '../lib/audioEngine';

const CATEGORIES = {
  strike:   ['1', '2', '3', '4', '5', '6', '1-1', 'body-2', 'body-3', '1 2', '1 2 3', '1 body'],
  defense:  ['slip-left', 'slip-right', 'roll-under', 'weave'],
  footwork: ['pivot', 'drop'],
  counter:  ['2', '3', '5', '6', 'body-3'],
  reset:    ['pivot', 'drop', 'slip-left', 'slip-right'],
};

const GRAMMAR = {
  strike:   ['strike', 'defense', 'footwork', 'reset'],
  defense:  ['counter', 'footwork', 'reset'],
  footwork: ['strike', 'footwork', 'defense'],
  counter:  ['strike', 'reset', 'footwork'],
  reset:    ['strike', 'footwork'],
};

const MODE_WEIGHTS = {
  boxing_basic: {
    strike: 0.55, defense: 0.15, footwork: 0.15, counter: 0.10, reset: 0.05
  },
  defense_focus: {
    strike: 0.25, defense: 0.35, footwork: 0.15, counter: 0.20, reset: 0.05
  },
  footwork_focus: {
    strike: 0.25, defense: 0.15, footwork: 0.40, counter: 0.10, reset: 0.10
  },
  conditioning: {
    strike: 0.60, defense: 0.10, footwork: 0.15, counter: 0.10, reset: 0.05
  },
};

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

function pickWeightedCategory(allowedCategories, mode) {
  const weights = MODE_WEIGHTS[mode] || MODE_WEIGHTS.boxing_basic;
  const filteredWeights = allowedCategories.map(cat => weights[cat] || 0);
  const totalWeight = filteredWeights.reduce((acc, w) => acc + w, 0);

  if (totalWeight <= 0) return pickRandom(allowedCategories);

  let random = Math.random() * totalWeight;
  for (let i = 0; i < allowedCategories.length; i++) {
    if (random < filteredWeights[i]) return allowedCategories[i];
    random -= filteredWeights[i];
  }
  return allowedCategories[0];
}

function getCategoryOfMove(move, expectedCategories) {
  for (const cat of expectedCategories) {
    if (CATEGORIES[cat].includes(move)) return cat;
  }
  for (const cat in CATEGORIES) {
    if (CATEGORIES[cat].includes(move)) return cat;
  }
  return 'strike';
}

export function useComboEngine(mode = 'boxing_basic') {
  const generateCombo = useCallback(() => {
    const combo = [];
    const actualLength = Math.random() < 0.7 ? (Math.floor(Math.random() * 2) + 2) : 4;

    // 1. Start from category 'strike' or 'footwork' (random, weighted by mode)
    let currentCategory = pickWeightedCategory(['strike', 'footwork'], mode);

    for (let i = 0; i < actualLength; i++) {
      // 2. Pick a random move from that category
      let moves = CATEGORIES[currentCategory];
      
      // Filter out previous move to prevent identical moves in a row (Test 3)
      if (combo.length > 0) {
        const lastMove = combo[combo.length - 1];
        const filtered = moves.filter(m => m !== lastMove);
        if (filtered.length > 0) moves = filtered;
      }

      const move = pickRandom(moves);
      combo.push(move);

      // 3. Look up that move's category in CATEGORIES (reverse lookup)
      // Using expected currentCategory to handle ambiguous moves like 'pivot'
      currentCategory = getCategoryOfMove(move, [currentCategory]);

      // 4. Use GRAMMAR to get allowed next categories
      const allowedNext = GRAMMAR[currentCategory];

      // 5/6. Filter by weights > 0 and pick next category using weighted random
      currentCategory = pickWeightedCategory(allowedNext, mode);
      
      // (Step 7: Pick random move from that category happens at start of next iteration)
    }
    return combo.join(' ');
  }, [mode]);

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
