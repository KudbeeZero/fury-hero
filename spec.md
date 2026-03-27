# Fury Hero - Rhythm Game

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Full rhythm game inspired by Guitar Hero
- 5-lane note highway (Green, Red, Yellow, Blue, Orange)
- Notes (gems) scrolling down toward strum line at bottom
- Keyboard input: A/S/D/F/G for frets, single-keypress mode (no strum key needed)
- Web Audio API: synthesized beat as built-in Practice track + MP3 upload for Quick Play
- BPM-based note chart generation (notes aligned to beats)
- Score, combo multiplier (1x base, +1 every 10 notes), streak counter, accuracy (Perfect/Good/Miss)
- Progress bar, pause menu
- Title/Main menu with Play, Songs, Settings
- Song select screen (2 placeholder tracks)
- Gameplay screen with highway center stage
- End-of-song results: score, accuracy %, max combo, stars (1-5 based on score), high score saving (localStorage)
- Visual style: rock concert arena, neon glow, particle effects on hit (flames/sparks/bursts)
- Scrolling highway with glowing lanes, guitar neck view at bottom
- Mobile-responsive: on-screen touch fret buttons + tap to hit
- Settings screen: note speed, input mode toggle

### Modify
N/A

### Remove
N/A

## Implementation Plan
1. Backend: store high scores per song (player name optional), song metadata
2. Frontend game engine:
   - Canvas-based or DOM-based highway renderer
   - Game loop with requestAnimationFrame
   - Web Audio API synth beat generator (120 BPM default)
   - Note chart generator: BPM-aligned note patterns
   - Input handler: keyboard (A/S/D/F/G) + touch
   - Particle system for hit effects
   - Screen manager: Menu → SongSelect → Gameplay → Results
   - HUD overlay: score, combo, accuracy, progress
   - Pause menu overlay
   - localStorage for high scores
