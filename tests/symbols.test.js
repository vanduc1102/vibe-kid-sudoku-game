import { describe, expect, it } from 'vitest';
import { getSymbol, SYMBOL_SETS } from '../src/symbols.js';

describe('symbol sets', () => {
  it.each(['vegetables', 'vehicles', 'shapes', 'gaming', 'math'])(
    'provides five Lucide symbols in the %s set',
    setKey => {
      expect(SYMBOL_SETS[setKey].symbols).toHaveLength(5);
      expect(SYMBOL_SETS[setKey].symbols.every(({ icon }) => Array.isArray(icon))).toBe(true);
      expect(getSymbol(setKey, 1)).toEqual(SYMBOL_SETS[setKey].symbols[0]);
      expect(getSymbol(setKey, 5)).toEqual(SYMBOL_SETS[setKey].symbols[4]);
      expect(getSymbol(setKey, 6)).toBeNull();
    }
  );
});
