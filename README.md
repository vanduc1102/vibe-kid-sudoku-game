# Kid Sudoku 🎉

A fun, kid-friendly Sudoku game built with **Three.js** as a **Progressive Web App (PWA)**. Play offline, enjoy cool 3D visuals, and learn to love Sudoku!

---

## ✨ Features

- 🎮 **Three.js 3D Board** – real 3D cells with canvas-texture numbers, particles, and animations
- 🔢 **Three difficulty levels** – Easy (36 clues), Medium (27 clues), Hard (22 clues)
- 💡 **Hint system** – up to 3 hints per game with smart cell suggestion
- ❤️ **Lives system** – 3 mistakes allowed; lose them all and it's game over
- ⏱️ **Live timer** – tracks your solving speed
- ⭐ **Score system** – based on difficulty, time, and mistakes
- 🏆 **High scores** – persisted per difficulty in localStorage
- 🔊 **Sound effects** – synthesized with Web Audio API (no files needed)
- 🎉 **Confetti win animation** – CSS-only particle celebration
- 💾 **Auto-save** – resumes your game on next visit
- 📱 **PWA / Offline** – service worker caches all assets after first load
- 🌐 **Responsive** – works on phones, tablets, and desktops

---

## 🚀 Getting Started

No build step required! Just open in a browser:

### Option 1 – Direct open
```
open index.html
```
> ⚠️ Some browsers restrict ES modules from `file://`. Use a local server for best results.

### Option 2 – Local HTTP server (recommended)
```bash
# Python 3
python3 -m http.server 8080

# Node.js (npx)
npx serve .

# Then open
open http://localhost:8080
```

### Option 3 – VS Code Live Server
Install the **Live Server** extension and click "Go Live".

---

## 📁 Project Structure

```
vibe-kid-sudoku-games/
├── index.html               ← Main HTML, PWA meta tags, overlay screens
├── manifest.json            ← PWA manifest
├── sw.js                    ← Service Worker (cache-first, offline support)
├── src/
│   ├── main.js              ← Three.js renderer + app bootstrap
│   ├── sudoku.js            ← Puzzle generation, solver, validator
│   ├── game.js              ← Game state, timer, scoring, persistence
│   ├── ui.js                ← DOM UI controller, screens, HUD
│   └── sounds.js            ← Web Audio API sound effects
├── assets/
│   ├── icons/
│   │   └── icon.svg         ← App icon (SVG, all PWA sizes)
│   └── styles/
│       └── main.css         ← Styles, animations, responsive design
└── README.md
```

---

## 🎮 How to Play

1. **Choose a difficulty** on the menu screen
2. **Tap a cell** on the board to select it (it glows gold and rises!)
3. **Tap a number** on the number pad to fill in the cell
4. **Wrong answer?** You lose a heart ❤️ (3 mistakes = game over)
5. **Need help?** Tap 💡 to use a hint (3 per game)
6. **Win!** Complete the board to see your score and confetti 🎊

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `1–9` | Place number |
| `Backspace` / `Delete` / `0` | Erase cell |
| `H` | Use hint |
| `Escape` | Pause / Resume |

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **Three.js r128** | 3D rendering, cells, particles, animations |
| **Web Audio API** | Synthesized sound effects |
| **Service Worker** | Offline caching (PWA) |
| **localStorage** | Game save & high scores |
| **ES Modules** | Modern JavaScript modules |
| **CSS3** | Animations, confetti, responsive layout |

---

## 🧩 Algorithm Notes

### Puzzle Generation
1. Generate a complete valid board using **randomized backtracking**
2. Remove cells one by one while checking **solution uniqueness** (max 2 solutions counted)
3. Stop when the target clue count for the difficulty is reached

### Hint System
- Scans all empty/wrong cells and picks the one with the **fewest valid candidates** (naked singles first)
- Maximizes the educational value of each hint

### Scoring
```
score = base_difficulty - (seconds × 2) - (mistakes × 50)
```
| Difficulty | Base Score |
|------------|-----------|
| Easy       | 500       |
| Medium     | 1,000     |
| Hard       | 2,000     |

---

## 📱 PWA Installation

1. Open the game in Chrome/Edge/Safari on any device
2. Look for the **"Install App"** or **"Add to Home Screen"** prompt
3. The game installs and works fully **offline**!

---

## 🎨 Design

- **Dark purple/navy** background (`#1a1a2e`)
- **Coral red** accents (`#FF6B6B`)
- **Golden yellow** selected cells (`#FFD700`)
- **Teal** subgrid borders (`#4ECDC4`)
- **Comic Sans** / **Chalkboard** font for numbers (kid-friendly)
- Floating particle stars in the background
- Settle animation when the board first appears
- Pulsing glow on selected cell

---

## 🌟 Credits

Built with ❤️ using Three.js, pure vanilla JavaScript, and lots of kid-tested fun.
