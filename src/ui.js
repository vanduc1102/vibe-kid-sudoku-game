/* =====================================================================
   Kid Sudoku – UI Controller
   Manages all HTML overlay screens and DOM updates
   ===================================================================== */

'use strict';

const CONFETTI_COLORS = ['#FF6B6B','#FFE66D','#4ECDC4','#45B7D1','#96CEB4','#DDA0DD','#FF9F43'];
const CONFETTI_COUNT  = 80;

export class UIController {
  /**
   * @param {import('./game.js').GameState} gameState
   * @param {import('./sounds.js').SoundManager} soundManager
   */
  constructor(gameState, soundManager) {
    this.state  = gameState;
    this.sounds = soundManager;

    // Screen references
    this.screens = {
      menu:     document.getElementById('menu-screen'),
      game:     document.getElementById('game-screen'),
      pause:    document.getElementById('pause-screen'),
      win:      document.getElementById('win-screen'),
      gameover: document.getElementById('gameover-screen')
    };

    // HUD elements
    this.timerDisplay   = document.getElementById('timer-display');
    this.heartsDisplay  = document.getElementById('hearts-display');
    this.scoreDisplay   = document.getElementById('score-display');
    this.hintsRemaining = document.getElementById('hints-remaining');
    this.btnMute        = document.getElementById('btn-mute');

    // Win screen elements
    this.winTime      = document.getElementById('win-time');
    this.winMistakes  = document.getElementById('win-mistakes');
    this.winScore     = document.getElementById('win-score');
    this.newRecordRow = document.getElementById('new-record-row');

    // Confetti container
    this.confettiContainer = document.getElementById('confetti-container');

    // High score displays
    this.hsEasy   = document.getElementById('hs-easy');
    this.hsMedium = document.getElementById('hs-medium');
    this.hsHard   = document.getElementById('hs-hard');

    this._confettiParticles = [];
    this._confettiTimer     = null;

    this._bindEvents();
  }

  /* ── Screen management ─────────────────────────────────────────────── */

  showScreen(name) {
    Object.values(this.screens).forEach(s => s.classList.remove('active'));
    if (this.screens[name]) {
      this.screens[name].classList.add('active');
    }
  }

  /* ── HUD Updates ───────────────────────────────────────────────────── */

  updateHUD() {
    if (!this.state.puzzle) return;

    // Timer
    this.timerDisplay.textContent = this.state.getTimerString();

    // Hearts (mistakes)
    const remaining = 3 - this.state.mistakes;
    this.heartsDisplay.textContent = '❤️'.repeat(Math.max(0, remaining)) +
      '🖤'.repeat(Math.min(3, this.state.mistakes));

    // Score
    this.scoreDisplay.textContent = this.state.score;

    // Hints
    this.hintsRemaining.textContent = this.state.hints;
  }

  updateHighScores() {
    const scores = this.state.getHighScores();
    this.hsEasy.textContent   = scores.easy   ? `⭐ ${scores.easy}`   : '—';
    this.hsMedium.textContent = scores.medium  ? `⭐ ${scores.medium}` : '—';
    this.hsHard.textContent   = scores.hard    ? `⭐ ${scores.hard}`   : '—';
  }

  /* ── Number pad ────────────────────────────────────────────────────── */

  setActiveNumber(num) {
    document.querySelectorAll('.num-btn').forEach(btn => {
      btn.classList.toggle('active-num', parseInt(btn.dataset.num) === num);
    });
  }

  /* ── Win Screen ────────────────────────────────────────────────────── */

  showWin(score, seconds, mistakes, isNewRecord) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    this.winTime.textContent     = `${m}:${s}`;
    this.winMistakes.textContent = mistakes === 0 ? '0 🎯' : `${mistakes}`;
    this.winScore.textContent    = score;
    this.newRecordRow.style.display = isNewRecord ? 'flex' : 'none';

    this.showScreen('win');
    this._spawnConfetti();
  }

  /* ── Confetti ──────────────────────────────────────────────────────── */

  _spawnConfetti() {
    this._clearConfetti();
    this.confettiContainer.innerHTML = '';

    for (let i = 0; i < CONFETTI_COUNT; i++) {
      const el = document.createElement('div');
      el.className = 'confetti-piece';

      const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      const size  = 8 + Math.random() * 12;
      const left  = Math.random() * 100;
      const delay = Math.random() * 3;
      const dur   = 2.5 + Math.random() * 2;
      const rot   = Math.random() * 360;
      const shape = Math.random() > 0.5 ? '50%' : '0%';

      el.style.cssText = `
        background: ${color};
        width: ${size}px;
        height: ${size}px;
        left: ${left}%;
        top: -20px;
        border-radius: ${shape};
        animation: confettiFall ${dur}s ${delay}s ease-in forwards;
        transform: rotate(${rot}deg);
      `;
      this.confettiContainer.appendChild(el);
    }

    // Clear after 6 seconds
    this._confettiTimer = setTimeout(() => this._clearConfetti(), 6000);
  }

  _clearConfetti() {
    if (this._confettiTimer) {
      clearTimeout(this._confettiTimer);
      this._confettiTimer = null;
    }
  }

  /* ── Shake animation for mistake ───────────────────────────────────── */

  shakeHearts() {
    this.heartsDisplay.classList.remove('shake-anim');
    void this.heartsDisplay.offsetWidth; // reflow
    this.heartsDisplay.classList.add('shake-anim');
  }

  /* ── Flash number button ───────────────────────────────────────────── */

  flashNumButton(num) {
    const btn = document.querySelector(`.num-btn[data-num="${num}"]`);
    if (!btn) return;
    btn.classList.add('flash-correct');
    setTimeout(() => btn.classList.remove('flash-correct'), 400);
  }

  /* ── Event binding ─────────────────────────────────────────────────── */

  /**
   * @param {Object} callbacks
   * @param {function(string)} callbacks.onDifficultySelect
   * @param {function(number)} callbacks.onNumPad
   * @param {function()} callbacks.onHint
   * @param {function()} callbacks.onPause
   * @param {function()} callbacks.onResume
   * @param {function()} callbacks.onQuit
   * @param {function()} callbacks.onPlayAgain
   * @param {function()} callbacks.onMenuFromWin
   * @param {function()} callbacks.onTryAgain
   * @param {function()} callbacks.onMenuFromOver
   */
  registerCallbacks(callbacks) {
    this._callbacks = callbacks;
  }

  _bindEvents() {
    // Difficulty buttons — selection only (no game start)
    let _selectedDifficulty = 'medium'; // matches the pre-selected HTML class
    document.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.sounds.playClick();
        _selectedDifficulty = btn.dataset.difficulty;
        // Update selected highlight
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('selected-diff'));
        btn.classList.add('selected-diff');
      });
    });

    // Start Game button
    document.getElementById('btn-start').addEventListener('click', () => {
      this.sounds.playClick();
      if (this._callbacks?.onDifficultySelect) {
        this._callbacks.onDifficultySelect(_selectedDifficulty);
      }
    });

    // Number pad
    document.querySelectorAll('.num-btn[data-num]').forEach(btn => {
      btn.addEventListener('click', () => {
        const num = parseInt(btn.dataset.num);
        this.sounds.playClick();
        if (this._callbacks?.onNumPad) {
          this._callbacks.onNumPad(num);
        }
      });
    });

    // Hint button
    document.getElementById('btn-hint').addEventListener('click', () => {
      if (this._callbacks?.onHint) this._callbacks.onHint();
    });

    // Pause / Resume
    document.getElementById('btn-pause').addEventListener('click', () => {
      this.sounds.playClick();
      if (this._callbacks?.onPause) this._callbacks.onPause();
    });
    document.getElementById('btn-resume').addEventListener('click', () => {
      this.sounds.playClick();
      if (this._callbacks?.onResume) this._callbacks.onResume();
    });

    // Menu button (in-game)
    document.getElementById('btn-menu').addEventListener('click', () => {
      this.sounds.playClick();
      if (this._callbacks?.onPause) this._callbacks.onPause(); // pause first
    });

    // Quit (from pause)
    document.getElementById('btn-quit').addEventListener('click', () => {
      this.sounds.playClick();
      if (this._callbacks?.onQuit) this._callbacks.onQuit();
    });

    // Mute
    this.btnMute.addEventListener('click', () => {
      const muted = this.sounds.toggleMute();
      this.btnMute.textContent = muted ? '🔇' : '🔊';
    });

    // Win screen
    document.getElementById('btn-play-again').addEventListener('click', () => {
      this.sounds.playClick();
      this._clearConfetti();
      if (this._callbacks?.onPlayAgain) this._callbacks.onPlayAgain();
    });
    document.getElementById('btn-menu-from-win').addEventListener('click', () => {
      this.sounds.playClick();
      this._clearConfetti();
      if (this._callbacks?.onMenuFromWin) this._callbacks.onMenuFromWin();
    });

    // Game over screen
    document.getElementById('btn-try-again').addEventListener('click', () => {
      this.sounds.playClick();
      if (this._callbacks?.onTryAgain) this._callbacks.onTryAgain();
    });
    document.getElementById('btn-menu-from-over').addEventListener('click', () => {
      this.sounds.playClick();
      if (this._callbacks?.onMenuFromOver) this._callbacks.onMenuFromOver();
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
      if (e.key >= '1' && e.key <= '9') {
        this.sounds.playClick();
        if (this._callbacks?.onNumPad) this._callbacks.onNumPad(parseInt(e.key));
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        this.sounds.playClick();
        if (this._callbacks?.onNumPad) this._callbacks.onNumPad(0);
      } else if (e.key === 'Escape') {
        if (this.state.isPaused) {
          if (this._callbacks?.onResume) this._callbacks.onResume();
        } else {
          if (this._callbacks?.onPause) this._callbacks.onPause();
        }
      } else if (e.key === 'h' || e.key === 'H') {
        if (this._callbacks?.onHint) this._callbacks.onHint();
      } else if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','W','a','A','s','S','d','D'].includes(e.key)) {
        // Arrow / WASD cell navigation
        if (!this.state.puzzle || this.state.isPaused ||
            this.state.isComplete || this.state.isOver) return;

        e.preventDefault(); // prevent page scroll

        let { row, col } = this.state.selectedCell;
        // If nothing selected yet, start at top-left
        if (row < 0) { row = 0; col = 0; }
        else {
          const up    = e.key === 'ArrowUp'    || e.key === 'w' || e.key === 'W';
          const down  = e.key === 'ArrowDown'  || e.key === 's' || e.key === 'S';
          const left  = e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A';
          const right = e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D';

          if (up)    row = Math.max(0, row - 1);
          if (down)  row = Math.min(8, row + 1);
          if (left)  col = Math.max(0, col - 1);
          if (right) col = Math.min(8, col + 1);
        }

        this.sounds.playClick();
        this.state.selectCell(row, col);
      }
    });
  }
}
