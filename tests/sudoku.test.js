import { describe, expect, it } from 'vitest';
import { generatePuzzle, getClueCount, getGridConfig } from '../src/sudoku.js';

describe('multi-size puzzle generation', () => {
  it.each(['small', 'medium_m', 'medium_s', 'large'])(
    'generates a valid %s puzzle',
    gridKey => {
      const config = getGridConfig(gridKey);
      const { puzzle, solution } = generatePuzzle('medium', gridKey);
      const { size, boxRows, colsPerCol } = config;

      expect(solution).toHaveLength(size);
      expect(solution.every(row => row.length === size)).toBe(true);
      expect(puzzle.flat().filter(value => value !== 0)).toHaveLength(
        getClueCount('medium', size)
      );

      for (let index = 0; index < size; index++) {
        expect(new Set(solution[index]).size).toBe(size);
        expect(new Set(solution.map(row => row[index])).size).toBe(size);
      }

      if (boxRows && colsPerCol) {
        for (let row = 0; row < size; row += boxRows) {
          for (let col = 0; col < size; col += colsPerCol) {
            const box = [];
            for (let r = row; r < row + boxRows; r++) {
              for (let c = col; c < col + colsPerCol; c++) box.push(solution[r][c]);
            }
            expect(new Set(box).size).toBe(boxRows * colsPerCol);
          }
        }
      }
    }
  );
});
