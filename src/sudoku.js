/* =====================================================================
   Kid Sudoku – Sudoku Logic Module
   Handles puzzle generation, validation, and solving
   ===================================================================== */

'use strict';

/**
 * Check if placing `num` at (row, col) on `board` is valid.
 * @param {number[][]} board - 9x9 array (0 = empty)
 * @param {number} row
 * @param {number} col
 * @param {number} num - 1-9
 * @returns {boolean}
 */
export function isValid(board, row, col, num) {
  // Check row
  for (let c = 0; c < 9; c++) {
    if (board[row][c] === num) return false;
  }
  // Check column
  for (let r = 0; r < 9; r++) {
    if (board[r][col] === num) return false;
  }
  // Check 3x3 box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (board[r][c] === num) return false;
    }
  }
  return true;
}

/**
 * Deep-clone a 9x9 board.
 * @param {number[][]} board
 * @returns {number[][]}
 */
function cloneBoard(board) {
  return board.map(row => [...row]);
}

/**
 * Shuffle array in-place (Fisher-Yates).
 * @param {any[]} arr
 */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Backtracking Sudoku solver.
 * @param {number[][]} board - modified in place
 * @param {boolean} randomize - shuffle number order for puzzle generation
 * @returns {boolean} - true if solved
 */
export function solveSudoku(board, randomize = false) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) {
        const nums = randomize
          ? shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])
          : [1, 2, 3, 4, 5, 6, 7, 8, 9];

        for (const num of nums) {
          if (isValid(board, r, c, num)) {
            board[r][c] = num;
            if (solveSudoku(board, randomize)) return true;
            board[r][c] = 0;
          }
        }
        return false; // trigger backtrack
      }
    }
  }
  return true; // all cells filled
}

/**
 * Count solutions (up to `limit`) to check uniqueness.
 * @param {number[][]} board
 * @param {number} limit
 * @returns {number}
 */
function countSolutions(board, limit = 2) {
  let count = 0;

  function solve(b) {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (b[r][c] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (isValid(b, r, c, num)) {
              b[r][c] = num;
              solve(b);
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

  solve(cloneBoard(board));
  return count;
}

/**
 * Generate a complete valid Sudoku solution.
 * @returns {number[][]}
 */
function generateFullBoard() {
  const board = Array.from({ length: 9 }, () => Array(9).fill(0));
  solveSudoku(board, true);
  return board;
}

/**
 * Generate a Sudoku puzzle with a unique solution.
 * @param {'easy'|'medium'|'hard'} difficulty
 * @returns {{ puzzle: number[][], solution: number[][] }}
 */
export function generatePuzzle(difficulty = 'medium') {
  const clueCount = {
    easy:   36,
    medium: 27,
    hard:   22
  }[difficulty] || 27;

  // Generate full solution
  const solution = generateFullBoard();
  const puzzle   = cloneBoard(solution);

  // Build list of all cell positions and shuffle
  const positions = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      positions.push([r, c]);
    }
  }
  shuffle(positions);

  // Remove cells while maintaining unique solution and clue count
  let removed = 0;
  const target = 81 - clueCount;

  for (const [r, c] of positions) {
    if (removed >= target) break;

    const backup = puzzle[r][c];
    puzzle[r][c] = 0;

    // Only remove if puzzle still has unique solution
    if (countSolutions(puzzle, 2) !== 1) {
      puzzle[r][c] = backup; // restore
    } else {
      removed++;
    }
  }

  return { puzzle, solution };
}

/**
 * Check if the user's filled puzzle matches the solution.
 * @param {number[][]} userGrid
 * @param {number[][]} solution
 * @returns {boolean}
 */
export function checkComplete(userGrid, solution) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (userGrid[r][c] !== solution[r][c]) return false;
    }
  }
  return true;
}

/**
 * Return a hint: one empty (or wrong) cell to fill.
 * Prioritises cells with the fewest valid candidates (naked singles).
 * @param {number[][]} userGrid
 * @param {number[][]} solution
 * @returns {{ row: number, col: number, value: number } | null}
 */
export function getHint(userGrid, solution) {
  // Collect all unfilled / wrong cells
  const candidates = [];

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (userGrid[r][c] !== solution[r][c]) {
        // Count valid placements for this cell in userGrid
        const board = cloneBoard(userGrid);
        board[r][c] = 0;
        let validCount = 0;
        for (let n = 1; n <= 9; n++) {
          if (isValid(board, r, c, n)) validCount++;
        }
        candidates.push({ row: r, col: c, value: solution[r][c], validCount });
      }
    }
  }

  if (candidates.length === 0) return null;

  // Sort by fewest candidates (easiest cell to deduce)
  candidates.sort((a, b) => a.validCount - b.validCount);
  const hint = candidates[0];
  return { row: hint.row, col: hint.col, value: hint.value };
}
