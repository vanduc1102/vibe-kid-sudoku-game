'use strict';

export class KeyboardController {
  constructor(state, sounds, getCallbacks) {
    this.state = state;
    this.sounds = sounds;
    this.getCallbacks = getCallbacks;
    document.addEventListener('keydown', event => this._handleKeyDown(event));
  }

  _handleKeyDown(event) {
    const callbacks = this.getCallbacks();
    if (event.key >= '1' && event.key <= '9') {
      if (Number(event.key) > this.state.gridConfig.maxNum) return;
      this.sounds.playClick();
      callbacks?.onNumPad?.(parseInt(event.key));
    } else if (event.key === 'Backspace' || event.key === 'Delete' || event.key === '0') {
      this.sounds.playClick();
      callbacks?.onNumPad?.(0);
    } else if (event.key === 'Escape') {
      if (this.state.isPaused) callbacks?.onResume?.();
      else callbacks?.onPause?.();
    } else if (event.key === 'h' || event.key === 'H') {
      callbacks?.onHint?.();
    } else if (event.key === 'Tab') {
      this._navigateByTab(event);
    } else if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','W','a','A','s','S','d','D'].includes(event.key)) {
      this._navigateByDirection(event);
    }
  }

  _navigateByTab(event) {
    if (!this._canNavigate()) return;
    event.preventDefault();

    let { row, col } = this.state.selectedCell;
    if (row < 0 || col < 0) {
      row = 0;
      col = 0;
    } else {
      const size = this.state.gridConfig.size;
      const totalCells = size * size;
      let index = row * size + col;
      index = event.shiftKey
        ? (index - 1 + totalCells) % totalCells
        : (index + 1) % totalCells;
      row = Math.floor(index / size);
      col = index % size;
    }

    this.sounds.playClick();
    this.state.selectCell(row, col);
  }

  _navigateByDirection(event) {
    if (!this._canNavigate()) return;
    event.preventDefault();

    let { row, col } = this.state.selectedCell;
    if (row < 0) {
      row = 0;
      col = 0;
    } else {
      const up = event.key === 'ArrowUp' || event.key === 'w' || event.key === 'W';
      const down = event.key === 'ArrowDown' || event.key === 's' || event.key === 'S';
      const left = event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A';
      const right = event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D';
      const maxIndex = this.state.gridConfig.size - 1;
      if (up) row = Math.max(0, row - 1);
      if (down) row = Math.min(maxIndex, row + 1);
      if (left) col = Math.max(0, col - 1);
      if (right) col = Math.min(maxIndex, col + 1);
    }

    this.sounds.playClick();
    this.state.selectCell(row, col);
  }

  _canNavigate() {
    return this.state.puzzle && !this.state.isPaused &&
      !this.state.isComplete && !this.state.isOver;
  }
}
