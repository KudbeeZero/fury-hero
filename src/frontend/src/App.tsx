import React, { useState, useCallback } from "react";
import type { GameSettings, GameState, SongData } from "./game/types";
import { DEFAULT_SETTINGS } from "./game/types";
import { GameplayScreen } from "./screens/GameplayScreen";
import { MenuScreen } from "./screens/MenuScreen";
import { ResultsScreen } from "./screens/ResultsScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { SongSelectScreen } from "./screens/SongSelectScreen";

type Screen = "menu" | "songSelect" | "gameplay" | "results" | "settings";

const PRACTICE_SONG: SongData = {
  id: "fury-beat",
  title: "Fury Beat",
  artist: "Fury Hero",
  bpm: 120,
  duration: 90,
  difficulty: "Easy",
  audioBuffer: null,
};

function loadSettings(): GameSettings {
  try {
    const stored = localStorage.getItem("fury-hero-settings");
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [settings, setSettings] = useState<GameSettings>(loadSettings);
  const [currentSong, setCurrentSong] = useState<SongData>(PRACTICE_SONG);
  const [finalState, setFinalState] = useState<GameState | null>(null);

  const handleSettingsUpdate = useCallback((s: GameSettings) => {
    setSettings(s);
    try {
      localStorage.setItem("fury-hero-settings", JSON.stringify(s));
    } catch {}
  }, []);

  const handlePlay = (song: SongData) => {
    setCurrentSong(song);
    setScreen("gameplay");
  };

  const handleFinished = (state: GameState) => {
    setFinalState(state);
    setScreen("results");
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100dvh",
        overflow: "hidden",
        background: "#020510",
      }}
    >
      {screen === "menu" && (
        <MenuScreen
          onPlay={() => setScreen("songSelect")}
          onSongs={() => setScreen("songSelect")}
          onPractice={() => handlePlay(PRACTICE_SONG)}
          onSettings={() => setScreen("settings")}
        />
      )}
      {screen === "songSelect" && (
        <SongSelectScreen
          onBack={() => setScreen("menu")}
          onPlay={handlePlay}
        />
      )}
      {screen === "gameplay" && (
        <GameplayScreen
          key={`${currentSong.id}-${Date.now()}`}
          song={currentSong}
          settings={settings}
          onFinished={handleFinished}
          onQuit={() => setScreen("menu")}
        />
      )}
      {screen === "results" && finalState && (
        <ResultsScreen
          state={finalState}
          song={currentSong}
          onPlayAgain={() => handlePlay(currentSong)}
          onMenu={() => setScreen("menu")}
        />
      )}
      {screen === "settings" && (
        <SettingsScreen
          settings={settings}
          onUpdate={handleSettingsUpdate}
          onBack={() => setScreen("menu")}
        />
      )}
    </div>
  );
}
