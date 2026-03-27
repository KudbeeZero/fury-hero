import React from "react";
import type { GameSettings } from "../game/types";

interface Props {
  settings: GameSettings;
  onUpdate: (s: GameSettings) => void;
  onBack: () => void;
}

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between">
        <span className="text-gray-300 text-sm uppercase tracking-widest">
          {label}
        </span>
        <span className="text-cyan-300 text-sm font-bold">
          {format ? format(value) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-cyan-400"
      />
    </div>
  );
}

export function SettingsScreen({ settings, onUpdate, onBack }: Props) {
  const update = (k: keyof GameSettings, v: GameSettings[keyof GameSettings]) =>
    onUpdate({ ...settings, [k]: v });

  return (
    <div
      className="relative w-full h-full flex flex-col overflow-auto"
      style={{
        background: "linear-gradient(180deg, #020510 0%, #0B0A20 100%)",
        fontFamily: "'Rajdhani', sans-serif",
      }}
    >
      <div
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: "#FFFFFF15" }}
      >
        <button
          type="button"
          onClick={onBack}
          className="text-gray-400 hover:text-white text-sm uppercase tracking-widest"
        >
          ← BACK
        </button>
        <h2
          className="text-3xl font-black uppercase tracking-widest text-white"
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            textShadow: "0 0 20px #3DE7FF88",
          }}
        >
          SETTINGS
        </h2>
        <div style={{ width: 60 }} />
      </div>

      <div className="flex flex-col gap-8 p-8 max-w-lg mx-auto w-full">
        <section>
          <h3
            className="text-lg font-bold text-cyan-300 uppercase tracking-widest mb-4 border-b pb-2"
            style={{ borderColor: "#3DE7FF33" }}
          >
            Gameplay
          </h3>
          <div className="flex flex-col gap-6">
            <Slider
              label="Note Speed"
              value={settings.noteSpeed}
              min={200}
              max={800}
              step={50}
              format={(v) => `${v} px/s`}
              onChange={(v) => update("noteSpeed", v)}
            />
            <Slider
              label="Hit Window"
              value={settings.hitWindow}
              min={30}
              max={150}
              step={5}
              format={(v) => `${v} ms`}
              onChange={(v) => update("hitWindow", v)}
            />
            <Slider
              label="Perfect Window"
              value={settings.perfectWindow}
              min={10}
              max={50}
              step={5}
              format={(v) => `${v} ms`}
              onChange={(v) => update("perfectWindow", v)}
            />
            <Slider
              label="Highway Perspective"
              value={settings.highwayPerspective}
              min={0}
              max={1}
              step={0.05}
              format={(v) => `${Math.round(v * 100)}%`}
              onChange={(v) => update("highwayPerspective", v)}
            />
          </div>
        </section>

        <section>
          <h3
            className="text-lg font-bold text-cyan-300 uppercase tracking-widest mb-4 border-b pb-2"
            style={{ borderColor: "#3DE7FF33" }}
          >
            Audio
          </h3>
          <div className="flex flex-col gap-6">
            <Slider
              label="Volume"
              value={Math.round(settings.volume * 100)}
              min={0}
              max={100}
              format={(v) => `${v}%`}
              onChange={(v) => update("volume", v / 100)}
            />
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-300 text-sm uppercase tracking-widest">
                  BPM Override
                </span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.bpmOverride !== null}
                    onChange={(e) =>
                      update("bpmOverride", e.target.checked ? 120 : null)
                    }
                    className="accent-cyan-400"
                  />
                  <span className="text-sm text-gray-400">Enable</span>
                </label>
              </div>
              {settings.bpmOverride !== null && (
                <div className="flex gap-3 items-center">
                  <input
                    type="number"
                    value={settings.bpmOverride}
                    min={60}
                    max={240}
                    onChange={(e) =>
                      update("bpmOverride", Number(e.target.value))
                    }
                    className="bg-transparent border-2 rounded px-3 py-1 text-white w-24 text-center"
                    style={{ borderColor: "#FFFFFF30" }}
                  />
                  <span className="text-gray-500 text-sm">BPM</span>
                </div>
              )}
            </div>
          </div>
        </section>

        <section>
          <h3
            className="text-lg font-bold text-cyan-300 uppercase tracking-widest mb-4 border-b pb-2"
            style={{ borderColor: "#3DE7FF33" }}
          >
            Input
          </h3>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300 text-sm uppercase tracking-widest">
                Input Mode
              </span>
              <div className="flex gap-2">
                {(["single", "strum"] as const).map((mode) => (
                  <button
                    type="button"
                    key={mode}
                    onClick={() => update("inputMode", mode)}
                    className="px-4 py-1 rounded border text-sm uppercase tracking-widest transition-all"
                    style={{
                      borderColor:
                        settings.inputMode === mode ? "#3DE7FF" : "#FFFFFF30",
                      color:
                        settings.inputMode === mode ? "#3DE7FF" : "#FFFFFF66",
                      background:
                        settings.inputMode === mode
                          ? "#3DE7FF15"
                          : "transparent",
                    }}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3
            className="text-lg font-bold text-cyan-300 uppercase tracking-widest mb-4 border-b pb-2"
            style={{ borderColor: "#3DE7FF33" }}
          >
            Display
          </h3>
          <div className="flex justify-between items-center">
            <span className="text-gray-300 text-sm uppercase tracking-widest">
              Show FPS
            </span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showFPS}
                onChange={(e) => update("showFPS", e.target.checked)}
                className="accent-cyan-400"
              />
              <span className="text-sm text-gray-400">
                {settings.showFPS ? "On" : "Off"}
              </span>
            </label>
          </div>
        </section>
      </div>
    </div>
  );
}
