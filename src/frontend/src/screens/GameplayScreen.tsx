import React, { useEffect, useRef, useState, useCallback } from "react";
import { AudioEngine } from "../game/AudioEngine";
import { GameEngine } from "../game/GameEngine";
import { generateChart } from "../game/NoteChart";
import type { GameSettings, GameState, Lane, SongData } from "../game/types";
import { LANE_COLORS } from "../game/types";

interface Props {
  song: SongData;
  settings: GameSettings;
  onFinished: (state: GameState) => void;
  onQuit: () => void;
}

const LANE_LABELS = ["A", "S", "D", "F", "G"];

export function GameplayScreen({ song, settings, onFinished, onQuit }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const audioRef = useRef<AudioEngine | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [judgmentText, setJudgmentText] = useState("");
  const [judgmentClass, setJudgmentClass] = useState("");
  const judgmentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showJudgment = useCallback((j: string | null) => {
    if (!j) return;
    if (judgmentTimer.current) clearTimeout(judgmentTimer.current);
    setJudgmentText(
      j === "perfect" ? "PERFECT!" : j === "good" ? "GOOD" : "MISS",
    );
    setJudgmentClass(
      j === "perfect"
        ? "text-cyan-300"
        : j === "good"
          ? "text-yellow-300"
          : "text-red-500",
    );
    judgmentTimer.current = setTimeout(() => setJudgmentText(""), 600);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: game engine initializes once on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let mounted = true;
    const audio = new AudioEngine();
    audioRef.current = audio;

    const init = async () => {
      let duration = song.duration;
      let bpm = song.bpm;

      if (song.audioFile) {
        setLoading(true);
        const result = await audio.loadMP3File(song.audioFile, settings.volume);
        duration = result.duration;
        bpm = result.bpm;
      }

      if (!mounted) return;

      const notes = generateChart({
        bpm: settings.bpmOverride ?? bpm,
        duration,
        density: 0.6,
      });

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const engine = new GameEngine(canvas, audio, notes, duration, settings, {
        onStateUpdate: (state) => {
          if (!mounted) return;
          setGameState(state);
          showJudgment(state.lastJudgment);
          setPaused(state.isPaused);
        },
        onFinished: (state) => {
          if (!mounted) return;
          onFinished(state);
        },
      });
      engineRef.current = engine;

      if (song.audioFile) {
        audio.startBufferSource();
      } else {
        audio.startSynthBeat(
          settings.bpmOverride ?? bpm,
          duration,
          settings.volume,
        );
      }

      engine.start();
      setLoading(false);
    };

    init();

    const handleResize = () => {
      if (engineRef.current)
        engineRef.current.resize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      mounted = false;
      engineRef.current?.destroy();
      audioRef.current?.destroy();
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const hitLane = (lane: Lane) => {
    engineRef.current?.hitLane(lane);
  };

  const togglePause = () => {
    engineRef.current?.togglePause();
  };

  const accuracy = gameState
    ? gameState.perfectCount + gameState.goodCount + gameState.missCount > 0
      ? Math.round(
          ((gameState.perfectCount + gameState.goodCount) /
            (gameState.perfectCount +
              gameState.goodCount +
              gameState.missCount)) *
            100,
        )
      : 100
    : 100;

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ background: "#020510" }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ display: "block" }}
      />

      {loading && (
        <div
          className="absolute inset-0 flex items-center justify-center z-50"
          style={{ background: "#020510EE" }}
        >
          <div className="text-center">
            <div
              className="text-4xl font-black text-cyan-300 uppercase tracking-widest animate-pulse"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              Loading...
            </div>
          </div>
        </div>
      )}

      {!loading && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ fontFamily: "'Rajdhani', sans-serif" }}
        >
          <div className="absolute top-0 left-0 right-0 flex justify-between items-start p-4">
            <div className="text-left">
              <div className="text-gray-500 text-xs uppercase tracking-widest">
                SCORE
              </div>
              <div
                className="text-white text-3xl font-black tabular-nums"
                style={{ textShadow: "0 0 10px #3DE7FF88" }}
              >
                {(gameState?.score ?? 0).toLocaleString()}
              </div>
            </div>

            <div className="text-center">
              <div className="text-gray-500 text-xs uppercase tracking-widest">
                STREAK
              </div>
              <div className="text-cyan-300 text-3xl font-black">
                {gameState?.streak ?? 0}
              </div>
            </div>

            <div className="flex items-start gap-4 pointer-events-auto">
              <div className="text-right">
                <div className="text-gray-500 text-xs uppercase tracking-widest">
                  COMBO
                </div>
                <div
                  className="text-3xl font-black"
                  style={{
                    color:
                      (gameState?.multiplier ?? 1) >= 4 ? "#FF9A2E" : "#FFD22E",
                    textShadow:
                      (gameState?.multiplier ?? 1) >= 4
                        ? "0 0 20px #FF9A2EAA"
                        : "none",
                  }}
                >
                  {gameState?.multiplier ?? 1}x
                </div>
              </div>
              <button
                type="button"
                onClick={togglePause}
                className="mt-1 w-10 h-10 rounded-lg border flex items-center justify-center text-gray-400 hover:text-white hover:border-cyan-400 transition-colors"
                style={{
                  borderColor: "#FFFFFF30",
                  background: "rgba(0,0,0,0.5)",
                }}
              >
                {paused ? "▶" : "⏸"}
              </button>
            </div>
          </div>

          <div className="absolute left-4 top-1/4 bottom-32 w-3 flex flex-col gap-2">
            <div
              className="text-gray-500 text-xs uppercase tracking-widest"
              style={{ writingMode: "vertical-rl", fontSize: 9 }}
            >
              PROGRESS
            </div>
            <div
              className="flex-1 rounded-full overflow-hidden"
              style={{ background: "#FFFFFF15" }}
            >
              <div
                className="w-full rounded-full transition-all"
                style={{
                  height: `${(gameState?.songProgress ?? 0) * 100}%`,
                  background: "linear-gradient(180deg, #3DE7FF, #7B5CFF)",
                  boxShadow: "0 0 8px #3DE7FF",
                }}
              />
            </div>
          </div>

          <div className="absolute right-4 top-1/4 text-right">
            <div className="text-gray-500 text-xs uppercase tracking-widest">
              ACCURACY
            </div>
            <div className="text-white text-xl font-bold">{accuracy}%</div>
            <div className="text-gray-600 text-xs mt-2">
              ✓ {(gameState?.perfectCount ?? 0) + (gameState?.goodCount ?? 0)}
            </div>
            <div className="text-red-500 text-xs">
              ✗ {gameState?.missCount ?? 0}
            </div>
          </div>

          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{ bottom: "18%" }}
          >
            {judgmentText && (
              <div
                className={`text-3xl font-black uppercase tracking-widest ${judgmentClass} judgment-pop`}
                style={{
                  textShadow: "0 0 20px currentColor",
                  fontFamily: "'Bebas Neue', sans-serif",
                }}
              >
                {judgmentText}
              </div>
            )}
          </div>

          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 text-center">
            <div className="text-gray-600 text-xs uppercase tracking-widest">
              {song.title}
            </div>
          </div>
        </div>
      )}

      {!loading && (
        <div
          className="absolute bottom-0 left-0 right-0 flex"
          style={{ height: 80 }}
        >
          {LANE_COLORS.map((color, i) => (
            <button
              type="button"
              key={color}
              onPointerDown={() => hitLane(i as Lane)}
              className="flex-1 flex items-center justify-center font-black text-xl rounded-t-xl border-t-2 select-none active:opacity-70 transition-opacity"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                background: `${color}33`,
                borderColor: color,
                color: color,
                boxShadow: `0 -4px 20px ${color}44`,
                touchAction: "none",
              }}
            >
              {LANE_LABELS[i]}
            </button>
          ))}
        </div>
      )}

      {paused && (
        <div
          className="absolute inset-0 flex items-center justify-center z-40"
          style={{
            background: "rgba(2,5,16,0.85)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="flex flex-col items-center gap-6 p-10 rounded-2xl border-2"
            style={{
              background: "rgba(11,10,32,0.95)",
              borderColor: "#3DE7FF44",
            }}
          >
            <h2
              className="text-5xl font-black text-white uppercase"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                textShadow: "0 0 20px #3DE7FF88",
              }}
            >
              PAUSED
            </h2>
            {[
              { label: "▶ RESUME", action: togglePause, primary: true },
              {
                label: "↺ RESTART",
                action: () => {
                  window.location.reload();
                },
                primary: false,
              },
              { label: "← QUIT", action: onQuit, primary: false },
            ].map((btn) => (
              <button
                type="button"
                key={btn.label}
                onClick={btn.action}
                className="w-56 py-3 text-lg font-black uppercase tracking-widest rounded-xl border-2 transition-all"
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  background: btn.primary ? "#3DE7FF22" : "transparent",
                  borderColor: btn.primary ? "#3DE7FF" : "#FFFFFF33",
                  color: btn.primary ? "#3DE7FF" : "#FFFFFF99",
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
