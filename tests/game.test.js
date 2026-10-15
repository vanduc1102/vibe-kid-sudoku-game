import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameState } from '../src/game.js';

function installLocalStorage() {
  const store = new Map();
  globalThis.localStorage = {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: k => store.delete(k)
  };
}

function emptyCells(game) {
  const cells = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (game.puzzle[r][c] === 0) cells.push({ row: r, col: c });
    }
  }
  return cells;
}

function wrongValue(game, row, col) {
  return (game.solution[row][col] % 9) + 1;
}

describe('GameState', () => {
  let game;

  beforeEach(() => {
    vi.useFakeTimers();
    installLocalStorage();
    game = new GameState();
    game.startNew('easy');
  });

  afterEach(() => {
    game._stopTimer();
    vi.useRealTimers();
  });

  describe('default cell selection', () => {
    it('selects the top-left cell when it is empty', () => {
      game.userGrid = Array.from({ length: 9 }, () => Array(9).fill(1));
      game.userGrid[0][0] = 0;
      expect(game._defaultCell()).toEqual({ row: 0, col: 0 });
    });

    it('selects the nearest empty cell when top-left is filled', () => {
      game.userGrid = Array.from({ length: 9 }, () => Array(9).fill(1));
      game.userGrid[1][0] = 0;
      game.userGrid[2][2] = 0;
      expect(game._defaultCell()).toEqual({ row: 1, col: 0 });
    });

    it('falls back to top-left when the board is full', () => {
      game.userGrid = Array.from({ length: 9 }, () => Array(9).fill(1));
      expect(game._defaultCell()).toEqual({ row: 0, col: 0 });
    });

    it('selects an empty cell on a new game', () => {
      const { row, col } = game.selectedCell;
      expect(game.puzzle[row][col]).toBe(0);
      expect(emptyCells(game)[0].row + emptyCells(game)[0].col)
        .toBeGreaterThanOrEqual(row + col);
    });

    it('selects a default cell when restoring a saved game', () => {
      const restored = new GameState();
      expect(restored.loadSaved()).toBe(true);
      restored._stopTimer();
      expect(restored.selectedCell).toEqual(game.selectedCell);
    });
  });

  describe('selectCell', () => {
    it('returns false for clues and true for empty cells', () => {
      const [empty] = emptyCells(game);
      expect(game.selectCell(empty.row, empty.col)).toBe(true);
      const clue = { row: 0, col: 0 };
      outer: for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (game.puzzle[r][c] !== 0) { clue.row = r; clue.col = c; break outer; }
        }
      }
      expect(game.selectCell(clue.row, clue.col)).toBe(false);
    });

    it('ignores selection while paused', () => {
      const before = { ...game.selectedCell };
      game.pause();
      expect(game.selectCell(8, 8)).toBe(false);
      expect(game.selectedCell).toEqual(before);
    });

    it('can select any cell within 9x9 grid', () => {
      game.selectCell(4, 5);
      expect(game.selectedCell).toEqual({ row: 4, col: 5 });
      game.selectCell(8, 8);
      expect(game.selectedCell).toEqual({ row: 8, col: 8 });
      game.selectCell(0, 0);
      expect(game.selectedCell).toEqual({ row: 0, col: 0 });
    });
  });

  describe('placeNumber', () => {
    it('places a correct number', () => {
      const [{ row, col }] = emptyCells(game);
      game.selectCell(row, col);
      expect(game.placeNumber(game.solution[row][col])).toBe('correct');
      expect(game.errorGrid[row][col]).toBe(false);
    });

    it('counts a mistake for a wrong number and flags the cell', () => {
      const [{ row, col }] = emptyCells(game);
      game.selectCell(row, col);
      const onMistake = vi.fn();
      game.onMistake = onMistake;
      expect(game.placeNumber(wrongValue(game, row, col))).toBe('wrong');
      expect(game.mistakes).toBe(1);
      expect(game.errorGrid[row][col]).toBe(true);
      expect(onMistake).toHaveBeenCalledWith(1);
    });

    it('erases a cell', () => {
      const [{ row, col }] = emptyCells(game);
      game.selectCell(row, col);
      game.placeNumber(wrongValue(game, row, col));
      expect(game.placeNumber(0)).toBe('erased');
      expect(game.userGrid[row][col]).toBe(0);
      expect(game.errorGrid[row][col]).toBe(false);
    });

    it('rejects input on clues and when no cell is selected', () => {
      game.selectedCell = { row: -1, col: -1 };
      expect(game.placeNumber(1)).toBe('no-cell');
      outer: for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (game.puzzle[r][c] !== 0) {
            game.selectedCell = { row: r, col: c };
            break outer;
          }
        }
      }
      expect(game.placeNumber(1)).toBe('clue');
    });

    it('lets the player keep trying after many mistakes', () => {
      const [{ row, col }] = emptyCells(game);
      game.selectCell(row, col);
      const bad = wrongValue(game, row, col);
      for (let i = 0; i < 5; i++) expect(game.placeNumber(bad)).toBe('wrong');
      expect(game.isOver).toBe(false);
      expect(game.mistakes).toBe(5);
    });

    it('wins when the last cell is filled correctly and saves high score', () => {
      const cells = emptyCells(game);
      const onComplete = vi.fn();
      game.onComplete = onComplete;
      let result;
      for (const { row, col } of cells) {
        game.selectCell(row, col);
        result = game.placeNumber(game.solution[row][col]);
      }
      expect(result).toBe('win');
      expect(game.isComplete).toBe(true);
      expect(game.score).toBe(1000);
      expect(onComplete).toHaveBeenCalledWith(1000);
      expect(game.getHighScores().large_easy).toBe(1000);
    });

    it('keeps a legacy 9x9 high score when the new score is lower', () => {
      localStorage.setItem('kid-sudoku-highscores', JSON.stringify({ easy: 1500 }));
      for (const { row, col } of emptyCells(game)) {
        game.selectCell(row, col);
        game.placeNumber(game.solution[row][col]);
      }

      expect(game.isNewRecord()).toBe(false);
      expect(game.getHighScores().easy).toBe(1500);
    });

    it('records a win with a zero score as a high score', () => {
      game.seconds = 10000;
      const cells = emptyCells(game);
      for (const { row, col } of cells) {
        game.selectCell(row, col);
        game.placeNumber(game.solution[row][col]);
      }

      expect(game.isComplete).toBe(true);
      expect(game.score).toBe(0);
      expect(game.getHighScores().large_easy).toBe(0);
      expect(game.isNewRecord()).toBe(true);
    });
  });

  describe('useHint', () => {
    it('fills a cell, consumes a hint and selects it', () => {
      const hint = game.useHint();
      expect(game.userGrid[hint.row][hint.col]).toBe(game.solution[hint.row][hint.col]);
      expect(game.hintedCells[hint.row][hint.col]).toBe(true);
      expect(game.hints).toBe(2);
      expect(game.selectedCell).toEqual({ row: hint.row, col: hint.col });
    });

    it('returns null when no hints remain', () => {
      game.hints = 0;
      expect(game.useHint()).toBeNull();
    });
  });

  describe('grid sizes', () => {
    it.each([
      ['small', 4],
      ['medium_m', 5],
      ['medium_s', 6],
      ['large', 9]
    ])('starts a %s grid', (gridKey, size) => {
      game.startNew('easy', gridKey);
      expect(game.gridConfig.size).toBe(size);
      expect(game.puzzle).toHaveLength(size);
      expect(game.puzzle.every(row => row.length === size)).toBe(true);
      expect(game.solution).toHaveLength(size);
      expect(game.solution.every(row => row.length === size)).toBe(true);
      expect(game.userGrid).toEqual(game.puzzle);
      expect(game.selectedCell).toMatchObject({ row: expect.any(Number), col: expect.any(Number) });
      expect(game.puzzle[game.selectedCell.row][game.selectedCell.col]).toBe(0);
    });

    it('supports symbol mode on 4x4 and 5x5 and keeps larger grids numeric', () => {
      game.startNew('easy', 'small', 'symbols', 'vehicles');
      expect(game.inputMode).toBe('symbols');
      expect(game.symbolSet).toBe('vehicles');

      game.startNew('easy', 'medium_m', 'symbols', 'shapes');
      expect(game.inputMode).toBe('symbols');
      expect(game.symbolSet).toBe('shapes');

      game.startNew('easy', 'medium_s', 'symbols', 'gaming');
      expect(game.inputMode).toBe('numbers');
      expect(game.symbolSet).toBe('gaming');
    });

    it('restores the selected symbol set with a saved game', () => {
      game.startNew('medium', 'small', 'symbols', 'gaming');
      const restored = new GameState();

      expect(restored.loadSaved()).toBe(true);
      restored._stopTimer();
      expect(restored.gridKey).toBe('small');
      expect(restored.inputMode).toBe('symbols');
      expect(restored.symbolSet).toBe('gaming');
    });

    it('stores symbol-mode high scores separately by icon set', () => {
      game.startNew('easy', 'small', 'symbols', 'vehicles');
      for (let row = 0; row < game.gridConfig.size; row++) {
        for (let col = 0; col < game.gridConfig.size; col++) {
          if (game.puzzle[row][col] === 0) {
            game.selectCell(row, col);
            game.placeNumber(game.solution[row][col]);
          }
        }
      }

      expect(game.isComplete).toBe(true);
      expect(game.getHighScores().small_symbols_vehicles_easy).toBeGreaterThan(0);
      expect(game.getHighScores().small_easy).toBeUndefined();
    });
  });

  describe('timer, pause and persistence', () => {
    it('counts seconds and formats them', () => {
      vi.advanceTimersByTime(65000);
      expect(game.seconds).toBe(65);
      expect(game.getTimerString()).toBe('01:05');
      expect(game.score).toBe(870);
    });

    it('updates the score immediately for mistakes', () => {
      const [{ row, col }] = emptyCells(game);
      game.selectCell(row, col);
      game.placeNumber(wrongValue(game, row, col));

      expect(game.score).toBe(950);
    });

    it('stops counting while paused and resumes afterwards', () => {
      vi.advanceTimersByTime(2000);
      game.pause();
      vi.advanceTimersByTime(5000);
      expect(game.seconds).toBe(2);
      game.resume();
      vi.advanceTimersByTime(3000);
      expect(game.seconds).toBe(5);
    });

    it('restores progress from storage', () => {
      const [{ row, col }] = emptyCells(game);
      game.selectCell(row, col);
      game.placeNumber(game.solution[row][col]);
      vi.advanceTimersByTime(3000);
      game._save();

      const restored = new GameState();
      expect(restored.loadSaved()).toBe(true);
      restored._stopTimer();
      expect(restored.userGrid[row][col]).toBe(game.solution[row][col]);
      expect(restored.seconds).toBe(3);
    });

    it('does not restore without saved data', () => {
      localStorage.removeItem('kid-sudoku-state');
      expect(new GameState().loadSaved()).toBe(false);
    });
  });
});
