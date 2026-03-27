import type React from "react";
import { useRef, useState } from "react";
import type { SongData } from "../game/types";

const BUILT_IN_SONGS: SongData[] = [
  {
    id: "fury-beat",
    title: "Fury Beat",
    artist: "Fury Hero",
    bpm: 120,
    duration: 90,
    difficulty: "Easy",
    audioBuffer: null,
  },
  {
    id: "neon-storm",
    title: "Neon Storm",
    artist: "Fury Hero",
    bpm: 140,
    duration: 90,
    difficulty: "Medium",
    audioBuffer: null,
  },
];

interface Props {
  onBack: () => void;
  onPlay: (song: SongData) => void;
}

export function SongSelectScreen({ onBack, onPlay }: Props) {
  const [songs, setSongs] = useState<SongData[]>(BUILT_IN_SONGS);
  const [selected, setSelected] = useState<SongData>(BUILT_IN_SONGS[0]);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const diffColor = (d: string) =>
    d === "Easy"
      ? "#22E06B"
      : d === "Medium"
        ? "#FFD22E"
        : d === "Hard"
          ? "#FF3B3B"
          : "#FF9A2E";

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    // We'll detect BPM when the game starts, just store the file here
    const customSong: SongData = {
      id: `custom-${Date.now()}`,
      title: file.name.replace(/\.[^.]+$/, ""),
      artist: "Custom Upload",
      bpm: 120, // placeholder, will be detected
      duration: 180,
      difficulty: "Custom",
      audioFile: file,
      isCustom: true,
    };
    setSongs((prev) => [...prev.filter((s) => !s.isCustom), customSong]);
    setSelected(customSong);
    setLoading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div
      className="relative w-full h-full flex flex-col"
      style={{
        background:
          "linear-gradient(180deg, #020510 0%, #0B0A20 60%, #150820 100%)",
        fontFamily: "'Rajdhani', sans-serif",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: "#FFFFFF15" }}
      >
        <button
          type="button"
          onClick={onBack}
          className="text-gray-400 hover:text-white transition-colors text-sm uppercase tracking-widest"
        >
          ← BACK
        </button>
        <h2
          className="text-3xl font-black uppercase tracking-widest text-white"
          style={{
            fontFamily: "'Bebas Neue', Impact, sans-serif",
            textShadow: "0 0 20px #3DE7FF88",
          }}
        >
          SELECT YOUR TRACK
        </h2>
        <div style={{ width: 60 }} />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Song list */}
        <div className="flex flex-col w-full max-w-md overflow-y-auto p-4 gap-3">
          {songs.map((song) => (
            <button
              type="button"
              key={song.id}
              onClick={() => setSelected(song)}
              className="text-left p-4 rounded-xl border-2 transition-all duration-200"
              style={{
                background:
                  selected.id === song.id
                    ? "linear-gradient(135deg, #3DE7FF15, #7B5CFF15)"
                    : "rgba(255,255,255,0.03)",
                borderColor: selected.id === song.id ? "#3DE7FF" : "#FFFFFF20",
                boxShadow:
                  selected.id === song.id ? "0 0 20px #3DE7FF33" : "none",
              }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-white font-bold text-lg">
                    {song.title}
                  </div>
                  <div className="text-gray-400 text-sm">{song.artist}</div>
                </div>
                <div className="text-right">
                  <div
                    className="text-xs font-bold uppercase px-2 py-1 rounded"
                    style={{
                      background: `${diffColor(song.difficulty)}33`,
                      color: diffColor(song.difficulty),
                    }}
                  >
                    {song.difficulty}
                  </div>
                  <div className="text-gray-500 text-xs mt-1">
                    {song.bpm} BPM
                  </div>
                </div>
              </div>
            </button>
          ))}

          {/* Upload button */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={loading}
            className="p-4 rounded-xl border-2 border-dashed text-center transition-all duration-200"
            style={{ borderColor: "#FFFFFF30", color: "#FFFFFF60" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "#3DE7FF";
              (e.currentTarget as HTMLButtonElement).style.color = "#3DE7FF";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "#FFFFFF30";
              (e.currentTarget as HTMLButtonElement).style.color = "#FFFFFF60";
            }}
          >
            {loading ? (
              <span className="animate-pulse">Loading...</span>
            ) : (
              <>
                <div className="text-2xl mb-1">+</div>
                <div className="text-sm uppercase tracking-widest font-bold">
                  Upload MP3
                </div>
                <div className="text-xs mt-1">Suno, custom tracks</div>
              </>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* Selected song detail */}
        <div
          className="flex-1 flex flex-col items-center justify-center p-8 border-l"
          style={{ borderColor: "#FFFFFF10" }}
        >
          <div
            className="w-48 h-48 rounded-2xl flex items-center justify-center mb-6 text-7xl"
            style={{
              background: "linear-gradient(135deg, #3DE7FF22, #7B5CFF22)",
              border: "2px solid #3DE7FF44",
              boxShadow: "0 0 40px #3DE7FF22",
            }}
          >
            🎸
          </div>
          <h3
            className="text-3xl font-black text-white uppercase mb-1"
            style={{
              fontFamily: "'Bebas Neue', Impact, sans-serif",
              textShadow: "0 0 15px #3DE7FF88",
            }}
          >
            {selected.title}
          </h3>
          <p className="text-gray-400 mb-4">{selected.artist}</p>
          <div className="flex gap-6 mb-8 text-center">
            <div>
              <div className="text-2xl font-bold text-cyan-300">
                {selected.bpm}
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-widest">
                BPM
              </div>
            </div>
            <div>
              <div
                className="text-2xl font-bold"
                style={{ color: diffColor(selected.difficulty) }}
              >
                {selected.difficulty}
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-widest">
                Difficulty
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {Math.floor(selected.duration / 60)}:
                {String(selected.duration % 60).padStart(2, "0")}
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-widest">
                Duration
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onPlay(selected)}
            className="px-12 py-4 text-xl font-black uppercase tracking-widest rounded-xl border-2 transition-all duration-200 active:scale-95"
            style={{
              fontFamily: "'Bebas Neue', Impact, sans-serif",
              background: "linear-gradient(135deg, #3DE7FF22, #7B5CFF22)",
              borderColor: "#3DE7FF",
              color: "#3DE7FF",
              boxShadow: "0 0 30px #3DE7FF44",
            }}
          >
            ▶ PLAY NOW
          </button>
        </div>
      </div>
    </div>
  );
}
