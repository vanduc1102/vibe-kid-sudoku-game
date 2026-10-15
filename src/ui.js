/* =====================================================================
   Kid Sudoku – UI coordinator
   Connects screen flows with focused menu, HUD, and keyboard controllers.
   ===================================================================== */

'use strict';

import { GameHUD } from './ui/game-hud.js';
import { KeyboardController } from './ui/keyboard.js';
import { MenuController } from './ui/menu.js';

const CONFETTI_COLORS = ['#FF6B6B','#FFE66D','#4ECDC4','#45B7D1','#96CEB4','#DDA0DD','#FF9F43'];
const CONFETTI_COUNT  = 80;
export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.2';

export class UIController {
  /**
   * @param {import('./game.js').GameState} gameState
   * @param {import('./sounds.js').SoundManager} soundManager
   */
  constructor(gameState, soundManager) {
    this.state = gameState;
    this.sounds = soundManager;
    this._callbacks = null;
    this.version = APP_VERSION;

    document.querySelectorAll('.app-version').forEach(el => {
      el.textContent = APP_VERSION;
    });

    this.screens = {
      menu: document.getElementById('menu-screen'),
      game: document.getElementById('game-screen'),
      pause: document.getElementById('pause-screen'),
      win: document.getElementById('win-screen'),
      gameover: document.getElementById('gameover-screen')
    };

    this.winTime = document.getElementById('win-time');
    this.winMistakes = document.getElementById('win-mistakes');
    this.winScore = document.getElementById('win-score');
    this.newRecordRow = document.getElementById('new-record-row');
    this.confettiContainer = document.getElementById('confetti-container');
    this.btnMute = document.getElementById('btn-mute');
    this._confettiTimer = null;

    this.menu = new MenuController(
      this.state,
      this.sounds,
      (...args) => this._callbacks?.onDifficultySelect?.(...args)
    );
    this.hud = new GameHUD(this.state);
    this.keyboard = new KeyboardController(
      this.state,
      this.sounds,
      () => this._callbacks
    );
    this._bindEvents();
  }

  showScreen(name) {
    Object.values(this.screens).forEach(screen => screen.classList.remove('active'));
    this.screens[name]?.classList.add('active');
  }

  updateHUD() {
    if (!this.state.puzzle) return;
    this.menu.syncFromState();
    this.hud.update();
  }

  updateHighScores() {
    this.menu.updateHighScores();
  }

  setActiveNumber(num) {
    this.hud.setActiveNumber(num);
  }

  flashNumButton(num) {
    this.hud.flashNumber(num);
  }

  shakeHearts() {
    this.hud.shakeHearts();
  }

  showWin(score, seconds, mistakes, isNewRecord) {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const remainder = (seconds % 60).toString().padStart(2, '0');
    this.winTime.textContent = `${minutes}:${remainder}`;
    this.winMistakes.textContent = mistakes === 0 ? '0 🎯' : `${mistakes}`;
    this.winScore.textContent = score;
    this.newRecordRow.style.display = isNewRecord ? 'flex' : 'none';
    this.showScreen('win');
    this._spawnConfetti();
  }

  registerCallbacks(callbacks) {
    this._callbacks = callbacks;
  }

  _bindEvents() {
    document.querySelectorAll('.num-btn[data-num]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.sounds.playClick();
        this._callbacks?.onNumPad?.(parseInt(btn.dataset.num));
      });
    });

    document.getElementById('btn-hint').addEventListener('click', () => {
      this._callbacks?.onHint?.();
    });

    document.getElementById('btn-pause').addEventListener('click', () => {
      this.sounds.playClick();
      this._callbacks?.onPause?.();
    });
    document.getElementById('btn-resume').addEventListener('click', () => {
      this.sounds.playClick();
      this._callbacks?.onResume?.();
    });
    document.getElementById('btn-menu').addEventListener('click', () => {
      this.sounds.playClick();
      this._callbacks?.onPause?.();
    });
    document.getElementById('btn-quit').addEventListener('click', () => {
      this.sounds.playClick();
      this._callbacks?.onQuit?.();
    });

    this.btnMute.addEventListener('click', () => {
      this.btnMute.textContent = this.sounds.toggleMute() ? '🔇' : '🔊';
    });

    document.getElementById('btn-play-again').addEventListener('click', () => {
      this.sounds.playClick();
      this._clearConfetti();
      this._callbacks?.onPlayAgain?.();
    });
    document.getElementById('btn-menu-from-win').addEventListener('click', () => {
      this.sounds.playClick();
      this._clearConfetti();
      this._callbacks?.onMenuFromWin?.();
    });
    document.getElementById('btn-try-again').addEventListener('click', () => {
      this.sounds.playClick();
      this._callbacks?.onTryAgain?.();
    });
    document.getElementById('btn-menu-from-over').addEventListener('click', () => {
      this.sounds.playClick();
      this._callbacks?.onMenuFromOver?.();
    });
  }

  _spawnConfetti() {
    this._clearConfetti();
    this.confettiContainer.innerHTML = '';

    for (let i = 0; i < CONFETTI_COUNT; i++) {
      const el = document.createElement('div');
      el.className = 'confetti-piece';
      const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      const size = 8 + Math.random() * 12;
      const left = Math.random() * 100;
      const delay = Math.random() * 3;
      const duration = 2.5 + Math.random() * 2;
      const rotation = Math.random() * 360;
      const shape = Math.random() > 0.5 ? '50%' : '0%';
      el.style.cssText = `
        background: ${color};
        width: ${size}px;
        height: ${size}px;
        left: ${left}%;
        top: -20px;
        border-radius: ${shape};
        animation: confettiFall ${duration}s ${delay}s ease-in forwards;
        transform: rotate(${rotation}deg);
      `;
      this.confettiContainer.appendChild(el);
    }

    this._confettiTimer = setTimeout(() => this._clearConfetti(), 6000);
  }

  _clearConfetti() {
    if (this._confettiTimer) {
      clearTimeout(this._confettiTimer);
      this._confettiTimer = null;
    }
  }
}
