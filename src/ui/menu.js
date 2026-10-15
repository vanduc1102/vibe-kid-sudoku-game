'use strict';

import { GRID_SIZES, getClueCount } from '../sudoku.js';
import { SYMBOL_SETS } from '../symbols.js';

export class MenuController {
  constructor(state, sounds, onStart) {
    this.state = state;
    this.sounds = sounds;
    this.onStart = onStart;
    this.gridKey = 'large';
    this.inputMode = 'numbers';
    this.symbolSet = 'vegetables';
    this.style = 'numbers';
    this.difficulty = 'medium';

    this._bindEvents();
    this._updateStyleControls();
    this.updateHighScores();
  }

  syncFromState() {
    if (this.gridKey !== this.state.gridKey) this._selectGrid(this.state.gridKey);
    const stateStyle = this.state.inputMode === 'symbols' ? this.state.symbolSet : 'numbers';
    if (this.style !== stateStyle) this._selectStyle(stateStyle);
  }

  updateHighScores() {
    const scores = this.state.getHighScores();
    const scorePrefix = this.inputMode === 'symbols'
      ? `${this.gridKey}_symbols_${this.symbolSet}`
      : this.gridKey;
    const formatScore = difficulty => {
      const key = `${scorePrefix}_${difficulty}`;
      const value = scores[key] ??
        (this.gridKey === 'large' && this.inputMode === 'numbers' ? scores[difficulty] : undefined);
      return value === undefined ? '—' : `⭐ ${value}`;
    };
    document.getElementById('hs-easy').textContent = formatScore('easy');
    document.getElementById('hs-medium').textContent = formatScore('medium');
    document.getElementById('hs-hard').textContent = formatScore('hard');

    const gridLabel = { small: '4×4', medium_m: '5×5', medium_s: '6×6', large: '9×9' }[this.gridKey];
    const styleLabel = this.inputMode === 'symbols' ? SYMBOL_SETS[this.symbolSet].label : 'Numbers';
    document.getElementById('highscores-title').textContent =
      `🏆 High Scores · ${gridLabel} · ${styleLabel}`;
  }

  _selectGrid(gridKey) {
    this.gridKey = gridKey;
    if (gridKey !== 'small' && gridKey !== 'medium_m') this._selectStyle('numbers');
    document.querySelectorAll('.grid-btn').forEach(btn => {
      const selected = btn.dataset.grid === gridKey;
      btn.classList.toggle('selected-grid', selected);
      btn.setAttribute('aria-pressed', String(selected));
    });

    const size = GRID_SIZES[gridKey].size;
    document.querySelectorAll('.diff-btn').forEach(btn => {
      btn.querySelector('.diff-desc').textContent = `${getClueCount(btn.dataset.difficulty, size)} clues`;
    });
    this._updateStyleControls();
    this.updateHighScores();
  }

  _selectStyle(style) {
    const supportsSymbols = this.gridKey === 'small' || this.gridKey === 'medium_m';
    this.style = supportsSymbols && SYMBOL_SETS[style] ? style : 'numbers';
    this.inputMode = this.style === 'numbers' ? 'numbers' : 'symbols';
    if (this.inputMode === 'symbols') this.symbolSet = this.style;
    document.querySelectorAll('.style-btn').forEach(btn => {
      const selected = btn.dataset.style === this.style;
      btn.classList.toggle('selected-style', selected);
      btn.setAttribute('aria-pressed', String(selected));
    });
    this._updateStyleControls();
    this.updateHighScores();
  }

  _updateStyleControls() {
    const supportsSymbols = this.gridKey === 'small' || this.gridKey === 'medium_m';
    document.getElementById('input-mode-section').hidden = !supportsSymbols;
    document.querySelectorAll('.style-btn').forEach(btn => {
      const selected = btn.dataset.style === this.style;
      btn.classList.toggle('selected-style', selected);
      btn.setAttribute('aria-pressed', String(selected));
    });
  }

  _bindEvents() {
    document.querySelectorAll('.grid-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.sounds.playClick();
        this._selectGrid(btn.dataset.grid);
      });
    });

    document.querySelectorAll('.style-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.sounds.playClick();
        this._selectStyle(btn.dataset.style);
      });
    });

    document.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.sounds.playClick();
        this.difficulty = btn.dataset.difficulty;
        document.querySelectorAll('.diff-btn').forEach(item => item.classList.remove('selected-diff'));
        btn.classList.add('selected-diff');
      });
    });

    document.getElementById('btn-start').addEventListener('click', () => {
      this.sounds.playClick();
      this.onStart?.(this.difficulty, this.gridKey, this.inputMode, this.symbolSet);
    });
  }
}
