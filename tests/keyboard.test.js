import { afterEach, describe, expect, it, vi } from 'vitest';
import { KeyboardController } from '../src/ui/keyboard.js';

describe('KeyboardController', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('registers a key handler and dispatches input through current callbacks', () => {
    let keydownHandler;
    vi.stubGlobal('document', {
      addEventListener: vi.fn((event, handler) => {
        if (event === 'keydown') keydownHandler = handler;
      })
    });
    const state = { gridConfig: { maxNum: 4 } };
    const sounds = { playClick: vi.fn() };
    const callbacks = { onNumPad: vi.fn() };

    new KeyboardController(state, sounds, () => callbacks);
    keydownHandler({ key: '3' });
    keydownHandler({ key: '5' });

    expect(callbacks.onNumPad).toHaveBeenCalledOnce();
    expect(callbacks.onNumPad).toHaveBeenCalledWith(3);
    expect(sounds.playClick).toHaveBeenCalledOnce();
  });

  it('navigates through the selected grid dimensions', () => {
    let keydownHandler;
    vi.stubGlobal('document', {
      addEventListener: vi.fn((event, handler) => {
        if (event === 'keydown') keydownHandler = handler;
      })
    });
    const state = {
      gridConfig: { size: 4 },
      puzzle: [[0]],
      selectedCell: { row: 3, col: 3 },
      isPaused: false,
      isComplete: false,
      isOver: false,
      selectCell: vi.fn()
    };
    const event = { key: 'Tab', shiftKey: false, preventDefault: vi.fn() };
    new KeyboardController(state, { playClick: vi.fn() }, () => ({}));

    keydownHandler(event);

    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(state.selectCell).toHaveBeenCalledWith(0, 0);
  });
});
