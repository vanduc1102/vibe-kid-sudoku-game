'use strict';

import { generatePuzzle, getGridConfig, checkComplete, getHint } from './sudoku.js';
import { SYMBOL_SETS } from './symbols.js';

const STORAGE_KEY  = 'kid-sudoku-state';
const SCORES_KEY   = 'kid-sudoku-highscores';
const MAX_MISTAKES = 3;
const MAX_HINTS    = 3;

function calcScore(gridKey, difficulty, seconds, mistakes) {
  const base = { small: 250, medium_m: 350, medium_s: 500, large: 2000 }[gridKey] || 1000;
  const diffMul = { easy: 0.5, medium: 1.0, hard: 2.0 }[difficulty] || 1.0;
  const timePenalty = Math.max(0, seconds * 2);
  const mistakePenalty = mistakes * 50;
  return Math.max(0, Math.round(base * diffMul - timePenalty - mistakePenalty));
}

export class GameState {
  constructor() {
    this.difficulty = 'medium';
    this.gridKey    = 'large';
    this.inputMode  = 'numbers';
    this.symbolSet  = 'vegetables';
    this.gridConfig = getGridConfig('large');
    this.puzzle      = null;
    this.solution    = null;
    this.userGrid    = null;
    this.errorGrid   = null;
    this.hintedCells = null;
    this.selectedCell = { row: -1, col: -1 };
    this.selectedNum  = 0;
    this.mistakes = 0;
    this.hints    = MAX_HINTS;
    this.score    = 0;
    this._timerInterval = null;
    this.seconds        = 0;
    this.isComplete = false;
    this.isPaused   = false;
    this.isOver     = false;
    this.onChange   = null;
    this.onComplete = null;
    this.onGameOver = null;
    this.onMistake  = null;
  }

  startNew(difficulty = 'medium', gridKey = null, inputMode = 'numbers', symbolSet = 'vegetables') {
    this._stopTimer();
    if (gridKey !== null && gridKey !== undefined) this.gridKey = gridKey;
    this.difficulty = difficulty;
    this.gridConfig = getGridConfig(this.gridKey);
    const supportsSymbols = this.gridKey === 'small' || this.gridKey === 'medium_m';
    this.inputMode = supportsSymbols && inputMode === 'symbols' ? 'symbols' : 'numbers';
    this.symbolSet = SYMBOL_SETS[symbolSet] ? symbolSet : 'vegetables';
    const { puzzle, solution } = generatePuzzle(difficulty, this.gridKey);
    this.puzzle   = puzzle;
    this.solution = solution;
    this.userGrid = puzzle.map(row => [...row]);
    const N = this.gridConfig.size;
    this.errorGrid   = Array.from({ length: N }, () => Array(N).fill(false));
    this.hintedCells = Array.from({ length: N }, () => Array(N).fill(false));
    this.selectedCell = this._defaultCell();
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

  _defaultCell() {
    const N = this.gridConfig.size;
    let best = { row: 0, col: 0 };
    let bestDist = Infinity;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (this.userGrid[r][c] === 0 && r + c < bestDist) {
          best = { row: r, col: c };
          bestDist = r + c;
        }
      }
    }
    return best;
  }

  selectCell(row, col) {
    if (this.isComplete || this.isOver || this.isPaused) return false;
    this.selectedCell = { row, col };
    this._emit();
    return !this._isClue(row, col);
  }

  placeNumber(num) {
    const { row, col } = this.selectedCell;
    if (row < 0 || col < 0) return 'no-cell';
    if (this.isComplete || this.isOver || this.isPaused) return 'inactive';
    if (this._isClue(row, col)) return 'clue';
    if (num === 0) {
      this.userGrid[row][col] = 0;
      this.errorGrid[row][col] = false;
      this._save();
      this._emit();
      return 'erased';
    }
    this.userGrid[row][col] = num;
    if (num !== this.solution[row][col]) {
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
    this.errorGrid[row][col] = false;
    if (checkComplete(this.userGrid, this.solution, this.gridConfig)) {
      this._stopTimer();
      this.isComplete = true;
      this.score = calcScore(this.gridKey, this.difficulty, this.seconds, this.mistakes);
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

  useHint() {
    if (this.hints <= 0 || this.isComplete || this.isOver || this.isPaused) return null;
    const hint = getHint(this.userGrid, this.solution, this.gridConfig);
    if (!hint) return null;
    this.hints--;
    this.userGrid[hint.row][hint.col] = hint.value;
    this.errorGrid[hint.row][hint.col] = false;
    this.hintedCells[hint.row][hint.col] = true;
    this.selectedCell = { row: hint.row, col: hint.col };
    if (checkComplete(this.userGrid, this.solution, this.gridConfig)) {
      this._stopTimer();
      this.isComplete = true;
      this.score = calcScore(this.gridKey, this.difficulty, this.seconds, this.mistakes);
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

  pause() {
    if (this.isComplete || this.isOver || this.isPaused) return;
    this.isPaused = true;
    this._stopTimer();
    this._emit();
  }

  resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this._startTimer();
    this._emit();
  }

  loadSaved() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data.puzzle || !data.solution || data.isComplete || data.isOver) return false;
      this.difficulty  = data.difficulty || 'medium';
      this.gridKey     = data.gridKey || 'large';
      this.gridConfig  = getGridConfig(this.gridKey);
      this.inputMode   = (this.gridKey === 'small' || this.gridKey === 'medium_m') &&
        data.inputMode === 'symbols' ? 'symbols' : 'numbers';
      this.symbolSet   = SYMBOL_SETS[data.symbolSet] ? data.symbolSet : 'vegetables';
      this.puzzle      = data.puzzle;
      this.solution    = data.solution;
      this.userGrid    = data.userGrid;
      const N = this.gridConfig.size;
      this.errorGrid   = data.errorGrid   || Array.from({ length: N }, () => Array(N).fill(false));
      this.hintedCells = data.hintedCells || Array.from({ length: N }, () => Array(N).fill(false));
      this.mistakes    = data.mistakes    || 0;
      this.hints       = data.hints       ?? MAX_HINTS;
      this.score       = data.score       || 0;
      this.seconds     = data.seconds     || 0;
      this.isComplete  = false;
      this.isPaused    = false;
      this.isOver      = false;
      this.selectedCell = this._defaultCell();
      this._startTimer();
      this._emit();
      return true;
    } catch (e) { return false; }
  }

  getHighScores() {
    try { return JSON.parse(localStorage.getItem(SCORES_KEY)) || {}; }
    catch (e) { return {}; }
  }

  getTimerString() {
    const m = Math.floor(this.seconds / 60).toString().padStart(2, '0');
    const s = (this.seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  _isClue(row, col) { return this.puzzle && this.puzzle[row][col] !== 0; }

  _startTimer() {
    this._stopTimer();
    this._timerInterval = setInterval(() => {
      if (!this.isPaused) { this.seconds++; this._emit(); }
    }, 1000);
  }

  _stopTimer() {
    if (this._timerInterval) { clearInterval(this._timerInterval); this._timerInterval = null; }
  }

  _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        difficulty:  this.difficulty,
        gridKey:     this.gridKey,
        inputMode:   this.inputMode,
        symbolSet:   this.symbolSet,
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
    } catch (e) { /* storage full or unavailable */ }
  }

  _saveHighScore() {
    try {
      const scores = this.getHighScores();
      const key = this._highScoreKey();
      const previousScore = scores[key] ??
        (this.gridKey === 'large' ? scores[this.difficulty] : undefined);
      if (previousScore === undefined || this.score > previousScore) {
        scores[key] = this.score;
        localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
        return true;
      }
    } catch (e) {}
    return false;
  }

  isNewRecord() {
    try {
      const scores = JSON.parse(localStorage.getItem(SCORES_KEY)) || {};
      const key = this._highScoreKey();
      const previous = scores[key] ?? (this.gridKey === 'large' ? scores[this.difficulty] ?? 0 : 0);
      return this.score >= previous;
    } catch (e) { return false; }
  }

  _highScoreKey() {
    return this.inputMode === 'symbols'
      ? `${this.gridKey}_symbols_${this.symbolSet}_${this.difficulty}`
      : `${this.gridKey}_${this.difficulty}`;
  }

  _emit() {
    if (!this.isComplete) {
      this.score = calcScore(this.gridKey, this.difficulty, this.seconds, this.mistakes);
    }
    if (this.onChange) this.onChange();
  }
}
