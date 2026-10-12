/* =====================================================================
   Kid Sudoku – Three.js Main Renderer
   Core 3D scene: board, cells, numbers, particles, animations
   ===================================================================== */

'use strict';

import * as THREE from 'three';
import { GameState }     from './game.js';
import { UIController }  from './ui.js';
import { SoundManager }  from './sounds.js';

/* ── Constants ─────────────────────────────────────────────────────── */

const CELL_SIZE    = 1.0;   // world units
const CELL_GAP     = 0.06;
const CELL_HEIGHT  = 0.18;
const BOARD_OFFSET = -4.0;  // center the 9x9 board

const COLORS = {
  bg:          0x1a1a2e,
  boardBase:   0x16213e,
  cellNormal:  0x0f3460,
  cellClue:    0x1a1a5e,
  cellSelected:0xFFD700,
  cellHover:   0x264f78,
  cellError:   0xc0392b,
  cellHinted:  0x8e44ad,
  cellCorrect: 0x27ae60,
  gridBorder:  0xe94560,
  subgridBorder:0x4ecdc4,
  particle:    0xffffff,
};

/* ── Renderer ──────────────────────────────────────────────────────── */

class SudokuRenderer {
  constructor(gameState, ui, sounds) {
    this.state  = gameState;
    this.ui     = ui;
    this.sounds = sounds;

    this.canvas  = document.getElementById('game-canvas');
    this.cellMeshes   = [];  // [row][col] → THREE.Mesh (box)
    this.numberMeshes = [];  // [row][col] → THREE.Mesh (plane with texture)
    this.particles    = null;
    this.boardGroup   = null;

    this._clock      = new THREE.Clock();
    this._wobbleDone = false;
    this._winAnim    = false;
    this._correctFlash = []; // { row, col, startTime }
    this._raycaster   = new THREE.Raycaster();
    this._mouse       = new THREE.Vector2();
    this._hoveredCell = { row: -1, col: -1 };
    this._deviceGamma = 0;
    this._deviceBeta  = 0;

    this._initScene();
    this._initLights();
    this._createParticles();
    this._createBoard();
    this._bindInput();
    this._bindDeviceMotion();
    this._animate();
  }

  /* ── Scene setup ─────────────────────────────────────────────────── */

  _initScene() {
    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas:    this.canvas,
      antialias: true,
      alpha:     false
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(COLORS.bg);
    this.renderer.shadowMap.enabled = true;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(COLORS.bg, 0.04);

    // Orthographic camera for top-down 2D-feel
    this.camera = new THREE.OrthographicCamera(
      -1, 1, 1, -1, 0.1, 100
    );
    this.camera.position.set(0, 12, 6);
    this.camera.lookAt(0, 0, 0);

    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  _resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);

    const aspect = w / h;
    const boardW = 9 * (CELL_SIZE + CELL_GAP) + 0.5;
    const half   = boardW / 2 + 0.5;

    if (aspect >= 1) {
      this.camera.left   = -half * aspect;
      this.camera.right  =  half * aspect;
      this.camera.top    =  half;
      this.camera.bottom = -half;
    } else {
      this.camera.left   = -half;
      this.camera.right  =  half;
      this.camera.top    =  half / aspect;
      this.camera.bottom = -half / aspect;
    }
    this.camera.updateProjectionMatrix();
  }

  /* ── Lights ──────────────────────────────────────────────────────── */

  _initLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 15, 8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width  = 1024;
    dirLight.shadow.mapSize.height = 1024;
    this.scene.add(dirLight);

    // Accent fill light (purple-pink)
    const fillLight = new THREE.PointLight(0xFF6B6B, 0.4, 30);
    fillLight.position.set(-5, 5, 5);
    this.scene.add(fillLight);
  }

  /* ── Particle system ─────────────────────────────────────────────── */

  _createParticles() {
    const count  = 200;
    const geom   = new THREE.BufferGeometry();
    const pos    = new Float32Array(count * 3);
    const sizes  = new Float32Array(count);
    const colors = new Float32Array(count * 3);

    const palette = [
      new THREE.Color(0xFF6B6B),
      new THREE.Color(0xFFE66D),
      new THREE.Color(0x4ECDC4),
      new THREE.Color(0x45B7D1),
      new THREE.Color(0x96CEB4)
    ];

    for (let i = 0; i < count; i++) {
      pos[i*3]   = (Math.random() - 0.5) * 30;
      pos[i*3+1] = (Math.random() - 0.5) * 20;
      pos[i*3+2] = (Math.random() - 0.5) * 10 - 2;
      sizes[i]   = 0.08 + Math.random() * 0.12;
      const c    = palette[Math.floor(Math.random() * palette.length)];
      colors[i*3]   = c.r;
      colors[i*3+1] = c.g;
      colors[i*3+2] = c.b;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geom.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size:         0.1,
      vertexColors: true,
      transparent:  true,
      opacity:      0.7,
      sizeAttenuation: true
    });

    this.particles = new THREE.Points(geom, mat);
    this.scene.add(this.particles);
    this._particlePos = pos;
    this._particleCount = count;
  }

  /* ── Board creation ─────────────────────────────────────────────── */

  _createBoard() {
    // Remove old board
    if (this.boardGroup) {
      this.scene.remove(this.boardGroup);
    }

    this.boardGroup   = new THREE.Group();
    this.cellMeshes   = Array.from({length:9}, () => Array(9).fill(null));
    this.numberMeshes = Array.from({length:9}, () => Array(9).fill(null));

    const step = CELL_SIZE + CELL_GAP;
    const totalSize = step * 9;
    const start = -totalSize / 2 + step / 2;

    // Board base
    const baseGeom = new THREE.BoxGeometry(totalSize + 0.4, 0.08, totalSize + 0.4);
    const baseMat  = new THREE.MeshLambertMaterial({ color: COLORS.boardBase });
    const base     = new THREE.Mesh(baseGeom, baseMat);
    base.position.y = -CELL_HEIGHT / 2 - 0.04;
    base.receiveShadow = true;
    this.boardGroup.add(base);

    // Subgrid separators (3x3 thick lines)
    this._createSubgridBorders(start, step, totalSize);

    // Cells
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const x = start + c * step;
        const z = start + r * step;

        // Cell box
        const geom = new THREE.BoxGeometry(CELL_SIZE - 0.02, CELL_HEIGHT, CELL_SIZE - 0.02);
        const mat  = new THREE.MeshLambertMaterial({ color: COLORS.cellNormal });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(x, 0, z);
        mesh.castShadow    = true;
        mesh.receiveShadow = true;
        mesh.userData = { row: r, col: c, baseY: 0 };

        this.cellMeshes[r][c] = mesh;
        this.boardGroup.add(mesh);

        // Number plane (slightly above cell top)
        const numMesh = this._makeNumberMesh(r, c);
        numMesh.position.set(x, CELL_HEIGHT / 2 + 0.01, z);
        numMesh.rotation.x = -Math.PI / 2;
        this.numberMeshes[r][c] = numMesh;
        this.boardGroup.add(numMesh);
      }
    }

    // Outer frame
    this._createOuterFrame(totalSize);

    // Settle animation: board starts high and drops
    this.boardGroup.position.y = 8;
    this._wobbleDone = false;
    this._wobbleStart = this._clock.getElapsedTime();

    this.scene.add(this.boardGroup);
  }

  _createSubgridBorders(start, step, totalSize) {
    const borderMat = new THREE.MeshLambertMaterial({ color: COLORS.subgridBorder });

    // Vertical separators at x positions for cols 3 and 6
    for (const ci of [3, 6]) {
      const x = start + ci * step - step / 2 - CELL_GAP / 2;
      const geom = new THREE.BoxGeometry(0.08, CELL_HEIGHT + 0.02, totalSize + 0.2);
      const mesh = new THREE.Mesh(geom, borderMat);
      mesh.position.set(x, 0, 0);
      this.boardGroup.add(mesh);
    }
    // Horizontal separators at z positions for rows 3 and 6
    for (const ri of [3, 6]) {
      const z = start + ri * step - step / 2 - CELL_GAP / 2;
      const geom = new THREE.BoxGeometry(totalSize + 0.2, CELL_HEIGHT + 0.02, 0.08);
      const mesh = new THREE.Mesh(geom, borderMat);
      mesh.position.set(0, 0, z);
      this.boardGroup.add(mesh);
    }
  }

  _createOuterFrame(totalSize) {
    const frameMat = new THREE.MeshLambertMaterial({ color: COLORS.gridBorder });
    const thickness = 0.12;
    const h = CELL_HEIGHT + 0.04;
    const half = totalSize / 2 + thickness / 2 + 0.04;

    const sides = [
      { size: [totalSize + thickness * 2 + 0.08, h, thickness], pos: [0, 0, -half] },
      { size: [totalSize + thickness * 2 + 0.08, h, thickness], pos: [0, 0,  half] },
      { size: [thickness, h, totalSize + 0.08],                  pos: [-half, 0, 0] },
      { size: [thickness, h, totalSize + 0.08],                  pos: [ half, 0, 0] }
    ];

    for (const { size, pos } of sides) {
      const geom = new THREE.BoxGeometry(...size);
      const mesh = new THREE.Mesh(geom, frameMat);
      mesh.position.set(...pos);
      this.boardGroup.add(mesh);
    }
  }

  /* ── Number textures ─────────────────────────────────────────────── */

  _makeNumberMesh(row, col) {
    const canvas  = document.createElement('canvas');
    canvas.width  = 128;
    canvas.height = 128;

    const texture = new THREE.CanvasTexture(canvas);
    const geom    = new THREE.PlaneGeometry(CELL_SIZE - 0.04, CELL_SIZE - 0.04);
    const mat     = new THREE.MeshBasicMaterial({
      map:         texture,
      transparent: true,
      depthWrite:  false
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.userData = { canvas, texture, row, col };
    this._drawNumber(mesh, 0, 'empty');
    return mesh;
  }

  _drawNumber(mesh, num, type) {
    const { canvas, texture } = mesh.userData;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (num === 0) {
      texture.needsUpdate = true;
      return;
    }

    const styles = {
      clue:    { color: '#ECF0F1', shadow: '#2980b9', weight: 'bold' },
      user:    { color: '#3498DB', shadow: '#1a5276', weight: 'bold' },
      error:   { color: '#E74C3C', shadow: '#922B21', weight: 'bold' },
      hinted:  { color: '#A29BFE', shadow: '#6C5CE7', weight: 'bold' },
      correct: { color: '#2ECC71', shadow: '#1E8449', weight: 'bold' }
    };
    const s = styles[type] || styles.user;

    ctx.font = `${s.weight} 80px "Comic Sans MS", "Chalkboard SE", cursive`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    // Shadow
    ctx.fillStyle = s.shadow;
    ctx.fillText(String(num), w / 2 + 3, h / 2 + 3);

    // Number
    ctx.fillStyle = s.color;
    ctx.fillText(String(num), w / 2, h / 2);

    texture.needsUpdate = true;
  }

  /* ── Board update (called by GameState.onChange) ─────────────────── */

  updateBoard() {
    if (!this.state.puzzle) return;
    const { puzzle, userGrid, errorGrid, hintedCells, selectedCell } = this.state;

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell   = this.cellMeshes[r][c];
        const numMesh = this.numberMeshes[r][c];
        if (!cell || !numMesh) continue;

        const isSel   = selectedCell.row === r && selectedCell.col === c;
        const isClue  = puzzle[r][c] !== 0;
        const isError = errorGrid[r][c];
        const isHinted= hintedCells[r][c];
        const val     = userGrid[r][c];

        // Cell color
        let color = isClue ? COLORS.cellClue : COLORS.cellNormal;
        if (isError)  color = COLORS.cellError;
        if (isHinted && !isError) color = COLORS.cellHinted;
        if (isSel)    color = COLORS.cellSelected;

        cell.material.color.setHex(color);

        // Lift selected cell
        const targetY = isSel ? 0.18 : cell.userData.baseY;
        cell.userData.targetY = targetY;

        // Number type
        let numType = 'empty';
        if (val !== 0) {
          if (isClue)   numType = 'clue';
          else if (isError) numType = 'error';
          else if (isHinted) numType = 'hinted';
          else           numType = 'user';
        }
        this._drawNumber(numMesh, val, numType);
        // Move number plane with cell
        numMesh.position.y = (isSel ? 0.18 : 0) + CELL_HEIGHT / 2 + 0.01;
      }
    }
  }

  /** Flash cell green briefly on correct placement */
  flashCorrect(row, col) {
    const cell = this.cellMeshes[row]?.[col];
    if (!cell) return;
    cell.material.color.setHex(COLORS.cellCorrect);
    this._correctFlash.push({ row, col, start: this._clock.getElapsedTime() });
  }

  /** Trigger win animation */
  triggerWinAnimation() {
    this._winAnim = true;
    this._winStart = this._clock.getElapsedTime();
  }

  /* ── Input handling ──────────────────────────────────────────────── */

  _bindInput() {
    // Mouse click
    this.canvas.addEventListener('click', e => this._handlePointer(e));

    // Touch tap
    this.canvas.addEventListener('touchend', e => {
      e.preventDefault();
      const t = e.changedTouches[0];
      this._handlePointer(t);
    }, { passive: false });

    // Mouse move for hover
    this.canvas.addEventListener('mousemove', e => this._handleHover(e));
  }

  _bindDeviceMotion() {
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', e => {
        this._deviceGamma = (e.gamma || 0) * 0.001; // left-right tilt
        this._deviceBeta  = (e.beta  || 0) * 0.001; // front-back tilt
      });
    }
  }

  _pointerToNDC(e) {
    const rect = this.canvas.getBoundingClientRect();
    const clientX = e.clientX !== undefined ? e.clientX : e.pageX;
    const clientY = e.clientY !== undefined ? e.clientY : e.pageY;
    this._mouse.x = ((clientX - rect.left) / rect.width)  * 2 - 1;
    this._mouse.y = -((clientY - rect.top)  / rect.height) * 2 + 1;
  }

  _handlePointer(e) {
    if (!this.state.puzzle || this.state.isPaused ||
        this.state.isComplete || this.state.isOver) return;

    this._pointerToNDC(e);
    this._raycaster.setFromCamera(this._mouse, this.camera);

    // Flatten cell meshes to array for raycasting
    const targets = this.cellMeshes.flat().filter(Boolean);
    const hits = this._raycaster.intersectObjects(targets);
    if (hits.length > 0) {
      const { row, col } = hits[0].object.userData;
      this.sounds.playClick();
      this.state.selectCell(row, col);
    }
  }

  _handleHover(e) {
    if (!this.state.puzzle) return;
    this._pointerToNDC(e);
    this._raycaster.setFromCamera(this._mouse, this.camera);
    const targets = this.cellMeshes.flat().filter(Boolean);
    const hits = this._raycaster.intersectObjects(targets);
    if (hits.length > 0) {
      const { row, col } = hits[0].object.userData;
      if (this._hoveredCell.row !== row || this._hoveredCell.col !== col) {
        this._hoveredCell = { row, col };
        this.canvas.style.cursor = 'pointer';
      }
    } else {
      this._hoveredCell = { row: -1, col: -1 };
      this.canvas.style.cursor = 'default';
    }
  }

  /* ── Animation loop ──────────────────────────────────────────────── */

  _animate() {
    requestAnimationFrame(() => this._animate());

    const elapsed = this._clock.getElapsedTime();
    const delta   = this._clock.getDelta ? 0.016 : 0.016;

    // Particle drift
    if (this.particles) {
      const pos = this._particlePos;
      for (let i = 0; i < this._particleCount; i++) {
        pos[i*3 + 1] += 0.008 * Math.sin(elapsed * 0.5 + i * 0.3);
        pos[i*3]     += 0.003 * Math.cos(elapsed * 0.3 + i * 0.2);
        if (pos[i*3+1] > 12) pos[i*3+1] = -12;
        if (Math.abs(pos[i*3]) > 18) pos[i*3] *= -1;
      }
      this.particles.geometry.attributes.position.needsUpdate = true;
      this.particles.rotation.y = elapsed * 0.02;
    }

    if (this.boardGroup) {
      // Settle animation (board drops from above)
      if (!this._wobbleDone) {
        const t = Math.min(1, (elapsed - this._wobbleStart) / 1.0);
        const ease = 1 - Math.pow(1 - t, 3); // cubic ease-out
        this.boardGroup.position.y = 8 * (1 - ease);
        if (t >= 1) {
          this.boardGroup.position.y = 0;
          this._wobbleDone = true;
        }
      }

      // Win animation: board spins and rises
      if (this._winAnim) {
        const wt = elapsed - this._winStart;
        this.boardGroup.rotation.y = wt * 1.5;
        this.boardGroup.position.y = Math.sin(wt * 2) * 0.5;
      }

      // Selected cell pulse
      const { row, col } = this.state.selectedCell;
      if (row >= 0 && col >= 0 && this.cellMeshes[row]?.[col]) {
        const cell = this.cellMeshes[row][col];
        const pulse = 1 + 0.04 * Math.sin(elapsed * 6);
        cell.scale.set(pulse, 1, pulse);
      }

      // Smooth cell Y movement
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          const cell = this.cellMeshes[r]?.[c];
          if (!cell) continue;
          const target = cell.userData.targetY ?? 0;
          cell.position.y += (target - cell.position.y) * 0.2;
          // Sync number mesh Y
          const nm = this.numberMeshes[r]?.[c];
          if (nm) {
            nm.position.y = cell.position.y + CELL_HEIGHT / 2 + 0.01;
          }
        }
      }

      // Correct-flash: revert cell color after 400ms
      this._correctFlash = this._correctFlash.filter(f => {
        if (elapsed - f.start > 0.4) {
          this.updateBoard();
          return false;
        }
        return true;
      });

      // Subtle device tilt
      this.camera.position.x = this._deviceGamma * 2;
      this.camera.position.z = 6 + this._deviceBeta * 2;
      this.camera.lookAt(0, 0, 0);
    }

    this.renderer.render(this.scene, this.camera);
  }
}

/* ── App bootstrap ──────────────────────────────────────────────────── */

const gameState  = new GameState();
const sounds     = new SoundManager();
const ui         = new UIController(gameState, sounds);

// Create renderer after DOM is ready
const renderer   = new SudokuRenderer(gameState, ui, sounds);

/* ── Wire up GameState events ─────────────────────────────────────── */

gameState.onChange = () => {
  renderer.updateBoard();
  ui.updateHUD();
};

gameState.onComplete = (score) => {
  sounds.playWin();
  renderer.triggerWinAnimation();
  const isNew = gameState.isNewRecord();
  ui.showWin(score, gameState.seconds, gameState.mistakes, isNew);
  ui.updateHighScores();
};

gameState.onGameOver = () => {
  sounds.playError();
  ui.showScreen('gameover');
};

gameState.onMistake = () => {
  sounds.playError();
  ui.shakeHearts();
};

/* ── UI Callbacks ─────────────────────────────────────────────────── */

ui.registerCallbacks({
  onDifficultySelect(difficulty) {
    gameState.startNew(difficulty);
    renderer._createBoard();
    renderer.updateBoard();
    ui.updateHUD();
    ui.showScreen('game');
  },

  onNumPad(num) {
    if (!gameState.puzzle) return;
    const { row, col } = gameState.selectedCell;

    if (num === 0) {
      // Erase
      const result = gameState.placeNumber(0);
      if (result === 'erased') ui.setActiveNumber(0);
      return;
    }

    // If no cell selected, just highlight the number
    if (row < 0) {
      ui.setActiveNumber(num);
      return;
    }

    // If cell is a clue, ignore
    if (gameState.puzzle[row][col] !== 0) return;

    ui.setActiveNumber(num);
    const result = gameState.placeNumber(num);

    if (result === 'correct') {
      sounds.playCorrect();
      renderer.flashCorrect(row, col);
      ui.flashNumButton(num);
    } else if (result === 'wrong') {
      sounds.playError();
      ui.shakeHearts();
    }
  },

  onHint() {
    if (gameState.hints <= 0) return;
    const hint = gameState.useHint();
    if (hint) {
      sounds.playHint();
      renderer.flashCorrect(hint.row, hint.col);
    }
  },

  onPause() {
    if (gameState.isComplete || gameState.isOver) return;
    gameState.pause();
    ui.showScreen('pause');
  },

  onResume() {
    gameState.resume();
    ui.showScreen('game');
  },

  onQuit() {
    gameState._stopTimer();
    ui.showScreen('menu');
    ui.updateHighScores();
  },

  onPlayAgain() {
    gameState.startNew(gameState.difficulty);
    renderer._createBoard();
    renderer.updateBoard();
    ui.updateHUD();
    ui.showScreen('game');
  },

  onMenuFromWin() {
    ui.showScreen('menu');
    ui.updateHighScores();
  },

  onTryAgain() {
    gameState.startNew(gameState.difficulty);
    renderer._createBoard();
    renderer.updateBoard();
    ui.updateHUD();
    ui.showScreen('game');
  },

  onMenuFromOver() {
    ui.showScreen('menu');
    ui.updateHighScores();
  }
});

/* ── Initial load ─────────────────────────────────────────────────── */

// Try to restore saved game
if (!gameState.loadSaved()) {
  ui.showScreen('menu');
} else {
  renderer._createBoard();
  renderer.updateBoard();
  ui.updateHUD();
  ui.showScreen('game');
}

ui.updateHighScores();
