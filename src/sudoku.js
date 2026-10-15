/* =====================================================================
   Kid Sudoku – Sudoku Logic Module
   Handles puzzle generation, validation, and solving (multi-grid)
   ===================================================================== */

'use strict';

export const GRID_SIZES = {
  small:    { size: 4, boxRows: 2, colsPerCol: 2, maxNum: 4 },
  medium_m: { size: 5, boxRows: 0, colsPerCol: 0, maxNum: 5 },
  medium_s: { size: 6, boxRows: 3, colsPerCol: 2, maxNum: 6 },
  large:    { size: 9, boxRows: 3, colsPerCol: 3, maxNum: 9 },
};

export function getGridConfig(key) {
  return GRID_SIZES[key] || GRID_SIZES.large;
}

function createBoard(s) { return Array.from({ length: s }, () => Array(s).fill(0)); }
function cloneBoard(b)  { return b.map(r => [...r]); }
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isValid(board, row, col, num, gc) {
  const s = gc.size;
  for (let c = 0; c < s; c++) if (board[row][c] === num) return false;
  for (let r = 0; r < s; r++) if (board[r][col] === num) return false;
  if (gc.boxRows && gc.colsPerCol) {
    const bx = Math.floor(row / gc.boxRows) * gc.boxRows;
    const by = Math.floor(col / gc.colsPerCol) * gc.colsPerCol;
    for (let r = bx; r < bx + gc.boxRows; r++) {
      for (let c = by; c < by + gc.colsPerCol; c++) {
        if (board[r][c] === num) return false;
      }
    }
  }
  return true;
}

export function solveSudoku(board, randomize = false, gc = GRID_SIZES.large) {
  const s = gc.size;
  for (let r = 0; r < s; r++) {
    for (let c = 0; c < s; c++) {
      if (board[r][c] === 0) {
        const nums = randomize
          ? shuffle(Array.from({ length: s }, (_, i) => i + 1))
          : Array.from({ length: s }, (_, i) => i + 1);
        for (const num of nums) {
          if (isValid(board, r, c, num, gc)) {
            board[r][c] = num;
            if (solveSudoku(board, randomize, gc)) return true;
            board[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function countSolutions(board, limit, gc) {
  const s = gc.size;
  let count = 0;
  function sol(b) {
    for (let r = 0; r < s; r++) {
      for (let c = 0; c < s; c++) {
        if (b[r][c] === 0) {
          for (let num = 1; num <= s; num++) {
            if (isValid(b, r, c, num, gc)) {
              b[r][c] = num;
              sol(b);
              if (count >= limit) return;
              b[r][c] = 0;
            }
          }
          return;
        }
      }
    }
    count++;
  }
  sol(cloneBoard(board));
  return count;
}

function genFull(gc) {
  const b = createBoard(gc.size);
  solveSudoku(b, true, gc);
  return b;
}

export function getClueCount(diff, size) {
  const pct = { easy: 0.45, medium: 0.58, hard: 0.68 };
  return (size * size) - Math.round(size * size * (pct[diff] || 0.55));
}

export function generatePuzzle(diff, gridKey = 'large') {
  const gc = getGridConfig(gridKey);
  const s = gc.size;
  const clueCount = getClueCount(diff, s);
  const solution = genFull(gc);
  const puzzle = cloneBoard(solution);
  const positions = [];
  for (let r = 0; r < s; r++) {
    for (let c = 0; c < s; c++) {
      positions.push([r, c]);
    }
  }
  shuffle(positions);
  let removed = 0;
  const tgt = (s * s) - clueCount;
  for (const [r, c] of positions) {
    if (removed >= tgt) break;
    const bk = puzzle[r][c];
    puzzle[r][c] = 0;
    if (countSolutions(puzzle, 2, gc) !== 1) {
      puzzle[r][c] = bk;
    } else {
      removed++;
    }
  }
  return { puzzle, solution, gridKey };
}

export function checkComplete(uGrid, sol, gc = GRID_SIZES.large) {
  const s = gc.size;
  for (let r = 0; r < s; r++) {
    for (let c = 0; c < s; c++) {
      if (uGrid[r][c] !== sol[r][c]) return false;
    }
  }
  return true;
}

export function getHint(uGrid, sol, gc = GRID_SIZES.large) {
  const s = gc.size;
  const cands = [];
  for (let r = 0; r < s; r++) {
    for (let c = 0; c < s; c++) {
      if (uGrid[r][c] !== sol[r][c]) {
        const b = cloneBoard(uGrid);
        b[r][c] = 0;
        let vc = 0;
        for (let n = 1; n <= s; n++) {
          if (isValid(b, r, c, n, gc)) vc++;
        }
        cands.push({ row: r, col: c, val: sol[r][c], vc });
      }
    }
  }
  if (!cands.length) return null;
  cands.sort((a, b) => a.vc - b.vc);
  const h = cands[0];
  return { row: h.row, col: h.col, value: h.val };
}
