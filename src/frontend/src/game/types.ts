export type Lane = 0 | 1 | 2 | 3 | 4;

export interface Note {
  id: string;
  lane: Lane;
  targetTime: number; // seconds from song start
  hit: boolean;
  missed: boolean;
}

export type Judgment = "perfect" | "good" | "miss" | null;

export interface HitResult {
  judgment: Judgment;
  lane: Lane;
  noteId: string;
}

export interface GameState {
  score: number;
  combo: number;
  maxCombo: number;
  streak: number;
  multiplier: number;
  perfectCount: number;
  goodCount: number;
  missCount: number;
  totalNotes: number;
  lastJudgment: Judgment;
  lastJudgmentTime: number;
  songProgress: number; // 0-1
  isPlaying: boolean;
  isPaused: boolean;
  isFinished: boolean;
}

export interface GameSettings {
  noteSpeed: number; // px/s, default 400
  hitWindow: number; // ms, default 80
  perfectWindow: number; // ms, default 30
  volume: number; // 0-1, default 0.8
  inputMode: "single" | "strum";
  showFPS: boolean;
  highwayPerspective: number; // 0-1, default 0.6
  bpmOverride: number | null;
}

export const DEFAULT_SETTINGS: GameSettings = {
  noteSpeed: 400,
  hitWindow: 80,
  perfectWindow: 30,
  volume: 0.8,
  inputMode: "single",
  showFPS: false,
  highwayPerspective: 0.6,
  bpmOverride: null,
};

export const LANE_COLORS = [
  "#22E06B",
  "#FF3B3B",
  "#FFD22E",
  "#2E7BFF",
  "#FF9A2E",
];
export const LANE_GLOW = [
  "#22E06B88",
  "#FF3B3B88",
  "#FFD22E88",
  "#2E7BFF88",
  "#FF9A2E88",
];
export const LANE_KEYS = ["a", "s", "d", "f", "g"];
export const LANE_NUMS = ["1", "2", "3", "4", "5"];

export interface SongData {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  duration: number;
  difficulty: string;
  isCustom?: boolean;
  audioBuffer?: AudioBuffer | null;
  audioFile?: File | null;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 0-1, decreases over time
  maxLife: number;
  color: string;
  size: number;
  isFlame: boolean;
}
