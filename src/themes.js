/* =====================================================================
   Kid Sudoku – Theme Manager
   Defines visual themes and applies them to CSS variables and 3D scene
   ===================================================================== */

'use strict';

export const THEMES = {
  space: {
    label: '🚀 Space',
    css: {
      '--color-bg':       '#1a1a2e',
      '--color-panel':    '#16213e',
      '--color-card':     '#0f3460',
      '--color-accent1':  '#FF6B6B',
      '--color-accent2':  '#FFE66D',
      '--color-accent3':  '#4ECDC4',
      '--color-accent4':  '#45B7D1',
      '--color-text':     '#ECF0F1',
      '--color-text-dim': '#95A5A6',
      '--color-easy':     '#2ECC71',
      '--color-medium':   '#F39C12',
      '--color-hard':     '#E74C3C',
      '--color-hint':     '#A29BFE',
    },
    three: {
      bg:            0x1a1a2e,
      boardBase:     0x16213e,
      cellNormal:    0x0f3460,
      cellClue:      0x1a1a5e,
      cellSelected:  0xFFD700,
      cellRelated:   0x1e4d8c,
      cellSameNum:   0xf0a500,
      cellHover:     0x264f78,
      cellError:     0xc0392b,
      cellHinted:    0x8e44ad,
      cellCorrect:   0x27ae60,
      gridBorder:    0xe94560,
      subgridBorder: 0x4ecdc4,
      particle:      0xffffff,
      fogColor:      0x1a1a2e,
      fogDensity:    0.04,
      particleColors: [0xFF6B6B, 0xFFE66D, 0x4ECDC4, 0x45B7D1, 0x96CEB4],
    }
  },
  ocean: {
    label: '🌊 Ocean',
    css: {
      '--color-bg':       '#0a1628',
      '--color-panel':    '#0d2137',
      '--color-card':     '#0e3554',
      '--color-accent1':  '#00CED1',
      '--color-accent2':  '#7FFFD4',
      '--color-accent3':  '#1E90FF',
      '--color-accent4':  '#48D1CC',
      '--color-text':     '#E0F7FA',
      '--color-text-dim': '#80CBC4',
      '--color-easy':     '#00E676',
      '--color-medium':   '#26C6DA',
      '--color-hard':     '#EF5350',
      '--color-hint':     '#80DEEA',
    },
    three: {
      bg:            0x0a1628,
      boardBase:     0x0d2137,
      cellNormal:    0x0e3554,
      cellClue:      0x082840,
      cellSelected:  0x7FFFD4,
      cellRelated:   0x0e4a6e,
      cellSameNum:   0x00bcd4,
      cellHover:     0x1a4a6a,
      cellError:     0xc62828,
      cellHinted:    0x006064,
      cellCorrect:   0x00897b,
      gridBorder:    0x00CED1,
      subgridBorder: 0x1E90FF,
      particle:      0x7FFFD4,
      fogColor:      0x0a1628,
      fogDensity:    0.04,
      particleColors: [0x00CED1, 0x7FFFD4, 0x1E90FF, 0x48D1CC, 0x00FA9A],
    }
  },
  forest: {
    label: '🌲 Forest',
    css: {
      '--color-bg':       '#0d1f0f',
      '--color-panel':    '#132a15',
      '--color-card':     '#1a3d1e',
      '--color-accent1':  '#76c442',
      '--color-accent2':  '#c8e86b',
      '--color-accent3':  '#52b788',
      '--color-accent4':  '#95d5b2',
      '--color-text':     '#d8f3dc',
      '--color-text-dim': '#74a57f',
      '--color-easy':     '#40916c',
      '--color-medium':   '#f4a261',
      '--color-hard':     '#e76f51',
      '--color-hint':     '#b7e4c7',
    },
    three: {
      bg:            0x0d1f0f,
      boardBase:     0x132a15,
      cellNormal:    0x1a3d1e,
      cellClue:      0x0f2e12,
      cellSelected:  0xc8e86b,
      cellRelated:   0x1f4d25,
      cellSameNum:   0x76c442,
      cellHover:     0x2d5a34,
      cellError:     0xb5460f,
      cellHinted:    0x386641,
      cellCorrect:   0x40916c,
      gridBorder:    0x76c442,
      subgridBorder: 0x52b788,
      particle:      0xc8e86b,
      fogColor:      0x0d1f0f,
      fogDensity:    0.035,
      particleColors: [0x76c442, 0xc8e86b, 0x52b788, 0x95d5b2, 0xf4a261],
    }
  },
  candy: {
    label: '🍭 Candy',
    css: {
      '--color-bg':       '#1a0a2e',
      '--color-panel':    '#2a1040',
      '--color-card':     '#3d1560',
      '--color-accent1':  '#ff69b4',
      '--color-accent2':  '#ffe4f0',
      '--color-accent3':  '#da8fff',
      '--color-accent4':  '#ffb3de',
      '--color-text':     '#fff0f8',
      '--color-text-dim': '#d4a0c0',
      '--color-easy':     '#00e5a0',
      '--color-medium':   '#ffa0d0',
      '--color-hard':     '#ff4488',
      '--color-hint':     '#da8fff',
    },
    three: {
      bg:            0x1a0a2e,
      boardBase:     0x2a1040,
      cellNormal:    0x3d1560,
      cellClue:      0x2a0a4a,
      cellSelected:  0xff69b4,
      cellRelated:   0x501a7a,
      cellSameNum:   0xda8fff,
      cellHover:     0x5a2080,
      cellError:     0xcc0044,
      cellHinted:    0x7b2d8b,
      cellCorrect:   0x00c896,
      gridBorder:    0xff69b4,
      subgridBorder: 0xda8fff,
      particle:      0xffb3de,
      fogColor:      0x1a0a2e,
      fogDensity:    0.04,
      particleColors: [0xff69b4, 0xda8fff, 0xffb3de, 0x00e5a0, 0xffe4f0],
    }
  },
  sunset: {
    label: '🌅 Sunset',
    css: {
      '--color-bg':       '#1a0a00',
      '--color-panel':    '#2d1200',
      '--color-card':     '#4a2000',
      '--color-accent1':  '#ff6b35',
      '--color-accent2':  '#ffd166',
      '--color-accent3':  '#ef476f',
      '--color-accent4':  '#f78c6b',
      '--color-text':     '#fff3e0',
      '--color-text-dim': '#b07040',
      '--color-easy':     '#06d6a0',
      '--color-medium':   '#ffd166',
      '--color-hard':     '#ef476f',
      '--color-hint':     '#f4a261',
    },
    three: {
      bg:            0x1a0a00,
      boardBase:     0x2d1200,
      cellNormal:    0x4a2000,
      cellClue:      0x301500,
      cellSelected:  0xffd166,
      cellRelated:   0x6b3010,
      cellSameNum:   0xff6b35,
      cellHover:     0x7a3a18,
      cellError:     0xb01020,
      cellHinted:    0x9b2335,
      cellCorrect:   0x06d6a0,
      gridBorder:    0xff6b35,
      subgridBorder: 0xef476f,
      particle:      0xffd166,
      fogColor:      0x1a0a00,
      fogDensity:    0.04,
      particleColors: [0xff6b35, 0xffd166, 0xef476f, 0xf78c6b, 0x06d6a0],
    }
  }
};

const STORAGE_KEY = 'kid-sudoku-theme';

export class ThemeManager {
  constructor() {
    this.current = localStorage.getItem(STORAGE_KEY) || 'space';
    if (!THEMES[this.current]) this.current = 'space';
    this._applyCSS(this.current);
  }

  /** Apply theme by key. Returns the three-color palette. */
  apply(key) {
    if (!THEMES[key]) return;
    this.current = key;
    localStorage.setItem(STORAGE_KEY, key);
    this._applyCSS(key);
    return THEMES[key].three;
  }

  getThreeColors(key) {
    return THEMES[key || this.current]?.three;
  }

  _applyCSS(key) {
    const vars = THEMES[key].css;
    const root = document.documentElement.style;
    for (const [prop, val] of Object.entries(vars)) {
      root.setProperty(prop, val);
    }
  }

  getAll() {
    return Object.entries(THEMES).map(([key, t]) => ({ key, label: t.label }));
  }
}
