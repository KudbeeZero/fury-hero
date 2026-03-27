import React, { useState, useEffect } from "react";
import type { GameState, SongData } from "../game/types";
import { useActor } from "../hooks/useActor";

interface Props {
  state: GameState;
  song: SongData;
  onPlayAgain: () => void;
  onMenu: () => void;
}

function calcStars(state: GameState): number {
  if (state.totalNotes === 0) return 0;
  const maxScore = state.totalNotes * 100 * 8;
  const pct = state.score / maxScore;
  if (pct >= 0.95) return 5;
  if (pct >= 0.75) return 4;
  if (pct >= 0.5) return 3;
  if (pct >= 0.3) return 2;
  if (pct >= 0.1) return 1;
  return 0;
}

function calcGrade(accuracy: number): string {
  if (accuracy >= 95) return "S";
  if (accuracy >= 80) return "A";
  if (accuracy >= 65) return "B";
  if (accuracy >= 50) return "C";
  return "D";
}

export function ResultsScreen({ state, song, onPlayAgain, onMenu }: Props) {
  const { actor } = useActor();
  const [playerName, setPlayerName] = useState("ROCKER");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [topScores, setTopScores] = useState<
    { playerName: string; score: bigint; stars: bigint }[]
  >([]);

  const accuracy =
    state.perfectCount + state.goodCount + state.missCount > 0
      ? Math.round(
          ((state.perfectCount + state.goodCount) /
            (state.perfectCount + state.goodCount + state.missCount)) *
            100,
        )
      : 100;
  const stars = calcStars(state);
  const grade = calcGrade(accuracy);

  useEffect(() => {
    if (!actor) return;
    actor
      .getTopScores(song.id)
      .then((scores) => setTopScores(scores.slice(0, 3)))
      .catch(() => {});
  }, [actor, song.id]);

  const handleSubmit = async () => {
    if (!actor) return;
    setSubmitting(true);
    try {
      await actor.submitScore(
        song.id,
        playerName,
        BigInt(state.score),
        BigInt(state.maxCombo),
        accuracy / 100,
        BigInt(stars),
      );
      const scores = await actor.getTopScores(song.id);
      setTopScores(scores.slice(0, 3));
      setSubmitted(true);
    } catch (e) {
      console.error(e);
    }
    setSubmitting(false);
  };

  const gradeColor =
    grade === "S"
      ? "#3DE7FF"
      : grade === "A"
        ? "#22E06B"
        : grade === "B"
          ? "#FFD22E"
          : grade === "C"
            ? "#FF9A2E"
            : "#FF3B3B";

  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center overflow-auto py-8"
      style={{
        background:
          "linear-gradient(180deg, #020510 0%, #0B0A20 60%, #150820 100%)",
        fontFamily: "'Rajdhani', sans-serif",
      }}
    >
      <h1
        className="text-5xl sm:text-7xl font-black uppercase tracking-widest text-white mb-2"
        style={{
          fontFamily: "'Bebas Neue', Impact, sans-serif",
          textShadow: "0 0 30px #3DE7FF88",
        }}
      >
        SONG COMPLETE
      </h1>
      <p className="text-gray-400 uppercase tracking-widest mb-6">
        {song.title}
      </p>

      <div
        className="text-8xl font-black mb-4"
        style={{
          color: gradeColor,
          textShadow: `0 0 40px ${gradeColor}`,
          fontFamily: "'Bebas Neue', sans-serif",
        }}
      >
        {grade}
      </div>

      <div className="flex gap-2 mb-8">
        {[1, 2, 3, 4, 5].map((s) => (
          <span
            key={s}
            className="text-4xl transition-all"
            style={{
              color: s <= stars ? "#FFD22E" : "#FFFFFF20",
              textShadow: s <= stars ? "0 0 15px #FFD22E" : "none",
            }}
          >
            ★
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 w-full max-w-2xl px-4">
        {[
          {
            label: "FINAL SCORE",
            value: state.score.toLocaleString(),
            color: "#3DE7FF",
          },
          { label: "MAX COMBO", value: `${state.maxCombo}x`, color: "#FFD22E" },
          { label: "ACCURACY", value: `${accuracy}%`, color: "#22E06B" },
          {
            label: "NOTES HIT",
            value: `${state.perfectCount + state.goodCount}/${state.totalNotes}`,
            color: "#FF9A2E",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-4 rounded-xl text-center border"
            style={{
              background: "rgba(255,255,255,0.04)",
              borderColor: "#FFFFFF15",
            }}
          >
            <div className="text-gray-500 text-xs uppercase tracking-widest mb-1">
              {stat.label}
            </div>
            <div className="text-2xl font-black" style={{ color: stat.color }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {!submitted ? (
        <div className="flex gap-3 mb-6 items-center">
          <input
            value={playerName}
            onChange={(e) =>
              setPlayerName(e.target.value.toUpperCase().slice(0, 12))
            }
            className="bg-transparent border-2 rounded-lg px-4 py-2 text-white uppercase tracking-widest text-center font-bold"
            style={{ borderColor: "#FFFFFF30", width: 160 }}
            placeholder="YOUR NAME"
            maxLength={12}
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2 rounded-lg border-2 font-bold uppercase tracking-widest transition-all"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              borderColor: "#3DE7FF",
              color: "#3DE7FF",
              background: "#3DE7FF15",
              opacity: submitting ? 0.5 : 1,
            }}
          >
            {submitting ? "..." : "SUBMIT SCORE"}
          </button>
        </div>
      ) : (
        <div className="text-green-400 font-bold uppercase tracking-widest mb-6">
          ✓ Score Submitted!
        </div>
      )}

      {topScores.length > 0 && (
        <div className="mb-6 w-full max-w-xs">
          <div className="text-gray-500 text-xs uppercase tracking-widest text-center mb-3">
            HIGH SCORES
          </div>
          {topScores.map((s, i) => (
            <div
              key={`${s.playerName}-${Number(s.score)}-${i}`}
              className="flex justify-between py-1 text-sm"
              style={{ borderBottom: "1px solid #FFFFFF10" }}
            >
              <span className="text-gray-400">
                #{i + 1} {s.playerName}
              </span>
              <span className="text-cyan-300 font-bold">
                {Number(s.score).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-4">
        {[
          { label: "↺ PLAY AGAIN", action: onPlayAgain, primary: true },
          { label: "← MENU", action: onMenu, primary: false },
        ].map((btn) => (
          <button
            type="button"
            key={btn.label}
            onClick={btn.action}
            className="px-8 py-3 rounded-xl border-2 font-black uppercase tracking-widest transition-all active:scale-95"
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
  );
}
