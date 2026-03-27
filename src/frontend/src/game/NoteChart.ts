import type { Lane, Note } from "./types";

interface ChartOptions {
  bpm: number;
  duration: number; // seconds
  density?: number; // 0-1, default 0.6
  seed?: number;
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export function generateChart(opts: ChartOptions): Note[] {
  const { bpm, duration, density = 0.6, seed = 42 } = opts;
  const rand = seededRandom(seed);
  const notes: Note[] = [];
  const beatDuration = 60 / bpm; // seconds per beat
  const subdivision = beatDuration / 2; // 8th notes
  let idCounter = 0;

  // Start notes after a 2-beat lead-in
  const startTime = beatDuration * 2;
  const totalBeats = Math.floor((duration - startTime) / subdivision);

  // Build patterns: runs of 3-6 notes with gaps
  let i = 0;
  let lastLane = -1;

  while (i < totalBeats) {
    const r = rand();
    if (r > density) {
      // gap: skip 1-3 beats
      i += Math.floor(rand() * 3) + 1;
      continue;
    }

    // Pattern type
    const patternType = rand();
    const patternLength = Math.floor(rand() * 5) + 2; // 2-6 notes

    for (let p = 0; p < patternLength && i < totalBeats; p++, i++) {
      const t = startTime + i * subdivision;
      if (t >= duration - 1) break;

      let lane: Lane;
      if (patternType < 0.3) {
        // Ascending run
        lane = Math.min(lastLane + 1, 4) as Lane;
      } else if (patternType < 0.6) {
        // Descending run
        lane = Math.max(lastLane - 1, 0) as Lane;
      } else if (patternType < 0.8) {
        // Alternating between two lanes
        const base = Math.floor(rand() * 4) as Lane;
        lane = (p % 2 === 0 ? base : (base + 1) % 5) as Lane;
      } else {
        // Random lane (avoid same lane twice)
        do {
          lane = Math.floor(rand() * 5) as Lane;
        } while (lane === lastLane && rand() > 0.2);
      }

      notes.push({
        id: `n${idCounter++}`,
        lane,
        targetTime: t,
        hit: false,
        missed: false,
      });
      lastLane = lane;
    }

    // Gap after pattern
    i += Math.floor(rand() * 2) + 1;
  }

  return notes;
}
