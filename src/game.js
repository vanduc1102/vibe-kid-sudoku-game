/* =====================================================================
   Kid Sudoku – Game State Manager
   Manages all game data, persistence, and game logic
   ===================================================================== */

'use strict';

import { generatePuzzle, isValid, checkComplete, getHint } from './sudoku.js';

const STORAGE_KEY  = 'kid-sudoku-state';
const SCORES_KEY   = 'kid-sudoku-highscores';
const MAX_MISTAKES = 3;
const MAX_HINTS    = 3;

/**
 * Score formula:
 *  base = difficulty multiplier × 1000
 *  time penalty = max(0, base - seconds × 2)
 *  mistake penalty = mistakes × 50
 */
function calcScore(difficulty, seconds, mistakes) {
  const base = { easy: 500, medium: 1000, hard: 2000 }[difficulty] || 1000;
  const timePenalty = Math.max(0, seconds * 2);
  const mistakePenalty = mistakes * 50;
  return Math.max(0, Math.round(base - timePenalty - mistakePenalty));
}

export class GameState {
  constructor() {
    // Game config
    this.difficulty    = 'medium';

    // Board state (9×9 arrays)
    this.puzzle        = null;   // original clues (0 = empty)
    this.solution      = null;   // complete solution
    this.userGrid      = null;   // player answers
    this.errorGrid     = null;   // which cells are wrong
    this.hintedCells   = null;   // which cells were hinted

    // UI state
    this.selectedCell  = { row: -1, col: -1 };
    this.selectedNum   = 0;

    // Counters
    this.mistakes      = 0;
    this.hints         = MAX_HINTS;
    this.score         = 0;

    // Timer
    this._timerInterval = null;
    this.seconds        = 0;

    // Flags
    this.isComplete    = false;
    this.isPaused      = false;
    this.isOver        = false;

    // Event callbacks
    this.onChange      = null; // () => void – called when state changes
    this.onComplete    = null; // (score) => void
    this.onGameOver    = null; // () => void
    this.onMistake     = null; // (count) => void
  }

  /* ── Public API ────────────────────────────────────────────────────── */

  /** Start a new game. */
  startNew(difficulty = 'medium') {
    this._stopTimer();

    this.difficulty   = difficulty;
    const { puzzle, solution } = generatePuzzle(difficulty);

    this.puzzle     = puzzle;
    this.solution   = solution;
    this.userGrid   = puzzle.map(row => [...row]);
    this.errorGrid  = Array.from({ length: 9 }, () => Array(9).fill(false));
    this.hintedCells= Array.from({ length: 9 }, () => Array(9).fill(false));

    this.selectedCell = { row: -1, col: -1 };
    this.selectedNum  = 0;
    this.mistakes   = 0;
    this.hints      = MAX_HINTS;
    this.score      = 0;
    this.seconds    = 0;
    this.isComplete = false;
    this.isPaused   = false;
    this.isOver     = false;

    this._startTimer();
    this._save();
    this._emit();
  }

  /** Select a cell by (row, col). Returns false if cell is a pre-filled clue. */
  selectCell(row, col) {
    if (this.isComplete || this.isOver || this.isPaused) return false;
    this.selectedCell = { row, col };
    this._emit();
    return !this._isClue(row, col);
  }

  /** Place a number (1-9) or erase (0) in the selected cell. */
  placeNumber(num) {
    const { row, col } = this.selectedCell;
    if (row < 0 || col < 0) return 'no-cell';
    if (this.isComplete || this.isOver || this.isPaused) return 'inactive';
    if (this._isClue(row, col)) return 'clue';

    // Erase
    if (num === 0) {
      this.userGrid[row][col] = 0;
      this.errorGrid[row][col] = false;
      this._save();
      this._emit();
      return 'erased';
    }

    // Place number
    this.userGrid[row][col] = num;

    if (num !== this.solution[row][col]) {
      // Wrong!
      this.errorGrid[row][col] = true;
      this.mistakes++;
      this._emit();
      if (this.mistakes >= MAX_MISTAKES) {
        this._stopTimer();
        this.isOver = true;
        this._save();
        this._emit();
        if (this.onGameOver) this.onGameOver();
        return 'gameover';
      }
      this._save();
      if (this.onMistake) this.onMistake(this.mistakes);
      return 'wrong';
    }

    // Correct!
    this.errorGrid[row][col] = false;

    // Check win
    if (checkComplete(this.userGrid, this.solution)) {
      this._stopTimer();
      this.isComplete = true;
      this.score = calcScore(this.difficulty, this.seconds, this.mistakes);
      this._saveHighScore();
      this._save();
      this._emit();
      if (this.onComplete) this.onComplete(this.score);
      return 'win';
    }

    this._save();
    this._emit();
    return 'correct';
  }

  /** Use a hint – fills in a suggested cell. Returns hint object or null. */
  useHint() {
    if (this.hints <= 0 || this.isComplete || this.isOver || this.isPaused) return null;

    const hint = getHint(this.userGrid, this.solution);
    if (!hint) return null;

    this.hints--;
    this.userGrid[hint.row][hint.col] = hint.value;
    this.errorGrid[hint.row][hint.col] = false;
    this.hintedCells[hint.row][hint.col] = true;
    this.selectedCell = { row: hint.row, col: hint.col };

    // Check win after hint
    if (checkComplete(this.userGrid, this.solution)) {
      this._stopTimer();
      this.isComplete = true;
      this.score = calcScore(this.difficulty, this.seconds, this.mistakes);
      this._saveHighScore();
      this._save();
      this._emit();
      if (this.onComplete) this.onComplete(this.score);
    } else {
      this._save();
      this._emit();
    }

    return hint;
  }

  /** Pause the game. */
  pause() {
    if (this.isComplete || this.isOver || this.isPaused) return;
    this.isPaused = true;
    this._stopTimer();
    this._emit();
  }

  /** Resume the game. */
  resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this._startTimer();
    this._emit();
  }

  /** Load saved state from localStorage. Returns true if state was restored. */
  loadSaved() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data.puzzle || !data.solution || data.isComplete || data.isOver) return false;

      this.difficulty  = data.difficulty  || 'medium';
      this.puzzle      = data.puzzle;
      this.solution    = data.solution;
      this.userGrid    = data.userGrid;
      this.errorGrid   = data.errorGrid   || Array.from({length:9},()=>Array(9).fill(false));
      this.hintedCells = data.hintedCells || Array.from({length:9},()=>Array(9).fill(false));
      this.mistakes    = data.mistakes    || 0;
      this.hints       = data.hints       ?? MAX_HINTS;
      this.score       = data.score       || 0;
      this.seconds     = data.seconds     || 0;
      this.isComplete  = false;
      this.isPaused    = false;
      this.isOver      = false;
      this.selectedCell= { row: -1, col: -1 };

      this._startTimer();
      this._emit();
      return true;
    } catch {
      return false;
    }
  }

  /** Get high scores for all difficulties. */
  getHighScores() {
    try {
      return JSON.parse(localStorage.getItem(SCORES_KEY)) || {};
    } catch {
      return {};
    }
  }

  /** Formatted timer string MM:SS */
  getTimerString() {
    const m = Math.floor(this.seconds / 60).toString().padStart(2, '0');
    const s = (this.seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  /** Whether a cell is a pre-filled clue. */
  _isClue(row, col) {
    return this.puzzle && this.puzzle[row][col] !== 0;
  }

  /* ── Timer ─────────────────────────────────────────────────────────── */

  _startTimer() {
    this._stopTimer();
    this._timerInterval = setInterval(() => {
      if (!this.isPaused) {
        this.seconds++;
        this._emit();
      }
    }, 1000);
  }

  _stopTimer() {
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
  }

  /* ── Persistence ───────────────────────────────────────────────────── */

  _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        difficulty:  this.difficulty,
        puzzle:      this.puzzle,
        solution:    this.solution,
        userGrid:    this.userGrid,
        errorGrid:   this.errorGrid,
        hintedCells: this.hintedCells,
        mistakes:    this.mistakes,
        hints:       this.hints,
        score:       this.score,
        seconds:     this.seconds,
        isComplete:  this.isComplete,
        isOver:      this.isOver
      }));
    } catch { /* storage full or unavailable */ }
  }

  _saveHighScore() {
    try {
      const scores = this.getHighScores();
      const prev = scores[this.difficulty] || 0;
      if (this.score > prev) {
        scores[this.difficulty] = this.score;
        localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
        return true; // new record
      }
    } catch {}
    return false;
  }

  isNewRecord() {
    try {
      const scores = JSON.parse(localStorage.getItem(SCORES_KEY)) || {};
      return this.score >= (scores[this.difficulty] || 0);
    } catch {
      return false;
    }
  }

  /* ── Event emission ────────────────────────────────────────────────── */

  _emit() {
    if (this.onChange) this.onChange();
  }
}
