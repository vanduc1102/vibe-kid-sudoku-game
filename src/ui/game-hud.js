'use strict';

import { createSymbolElement, SYMBOL_SETS } from '../symbols.js';

export class GameHUD {
  constructor(state) {
    this.state = state;
    this.timerDisplay = document.getElementById('timer-display');
    this.heartsDisplay = document.getElementById('hearts-display');
    this.scoreDisplay = document.getElementById('score-display');
    this.hintsRemaining = document.getElementById('hints-remaining');
  }

  update() {
    if (!this.state.puzzle) return;
    this.timerDisplay.textContent = this.state.getTimerString();
    this.scoreDisplay.textContent = this.state.score;
    this.hintsRemaining.textContent = this.state.hints;

    document.querySelectorAll('.num-btn[data-num]').forEach(btn => {
      const value = Number(btn.dataset.num);
      const symbol = SYMBOL_SETS[this.state.symbolSet]?.symbols[value - 1];
      btn.hidden = value !== 0 && (
        value > this.state.gridConfig.maxNum ||
        (this.state.inputMode === 'symbols' && !symbol)
      );
      if (value === 0 || btn.hidden) return;

      if (this.state.inputMode === 'symbols') {
        const renderedValue = `${this.state.symbolSet}-${value}`;
        if (btn.dataset.renderedValue !== renderedValue) {
          const shortcut = document.createElement('span');
          shortcut.className = 'symbol-shortcut';
          shortcut.textContent = value;
          shortcut.setAttribute('aria-hidden', 'true');
          btn.replaceChildren(createSymbolElement(symbol, 'symbol-icon'), shortcut);
          btn.dataset.renderedValue = renderedValue;
          btn.title = symbol.name;
          btn.setAttribute('aria-label', `${symbol.name}, keyboard shortcut ${value}`);
        }
      } else {
        const renderedValue = String(value);
        if (btn.dataset.renderedValue !== renderedValue) {
          btn.textContent = renderedValue;
          btn.dataset.renderedValue = renderedValue;
          btn.title = `Enter ${value}`;
          btn.setAttribute('aria-label', `Enter ${value}`);
        }
      }
    });
  }

  setActiveNumber(num) {
    document.querySelectorAll('.num-btn').forEach(btn => {
      btn.classList.toggle('active-num', parseInt(btn.dataset.num) === num);
    });
  }

  flashNumber(num) {
    const btn = document.querySelector(`.num-btn[data-num="${num}"]`);
    if (!btn) return;
    btn.classList.add('flash-correct');
    setTimeout(() => btn.classList.remove('flash-correct'), 400);
  }

  shakeHearts() {
    this.heartsDisplay.classList.remove('shake-anim');
    void this.heartsDisplay.offsetWidth;
    this.heartsDisplay.classList.add('shake-anim');
  }
}
