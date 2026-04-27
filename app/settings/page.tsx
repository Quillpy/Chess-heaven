"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { cn } from "@/lib/utils";

const boardThemes = [
  { name: "Classic", light: "#f3ebe2", dark: "#746253", accent: "#22c55e" },
  { name: "Blue", light: "#e9f3ff", dark: "#4c6684", accent: "#3b82f6" },
  { name: "Green", light: "#f7f0d8", dark: "#596a3b", accent: "#84cc16" },
  { name: "Wood", light: "#deb887", dark: "#8b4513", accent: "#d2691e" },
  { name: "Neon", light: "#1a1a2e", dark: "#16213e", accent: "#e94560" },
  { name: "Midnight", light: "#1a1a3c", dark: "#0a0a1f", accent: "#6366f1" },
  { name: "Ocean", light: "#e0f7fa", dark: "#006994", accent: "#00bcd4" },
  { name: "Lava", light: "#fffaf0", dark: "#8b0000", accent: "#ff4500" },
  { name: "Gold", light: "#fffacd", dark: "#8b7500", accent: "#ffd700" }
];

export default function SettingsPage() {
  const [boardThemeIndex, setBoardThemeIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const storedBoard = window.localStorage.getItem("chess-heaven-board-theme");
    if (storedBoard) {
      const idx = Number(storedBoard);
      if (boardThemes[idx]) setBoardThemeIndex(idx);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem("chess-heaven-board-theme", String(boardThemeIndex));
  }, [boardThemeIndex, loaded]);

  if (!loaded) return null;

  return (
    <main className="shell">
      <AppHeader />
      
      <div className="dashboard-layout" style={{ maxWidth: 800 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>Settings</h1>
        
        <div className="card">
          <p className="eyebrow" style={{ marginBottom: 20 }}>Match Experience</p>
          
          <div className="input-group" style={{ marginBottom: 24 }}>
            <label>Preferred Board Theme</label>
            <select
              className="select"
              value={boardThemeIndex}
              onChange={(e) => setBoardThemeIndex(Number(e.target.value))}
            >
              {boardThemes.map((t, i) => (
                <option key={t.name} value={i}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="theme-selector">
            {boardThemes.map((t, i) => (
              <button
                key={t.name}
                onClick={() => setBoardThemeIndex(i)}
                className={cn("theme-dot", i === boardThemeIndex && "active")}
                style={{
                  background: `linear-gradient(135deg, ${t.light} 50%, ${t.dark} 50%)`,
                  width: "100%",
                  aspectRatio: "1"
                }}
                title={t.name}
              />
            ))}
          </div>

          <p style={{ marginTop: 24, fontSize: 13, color: "var(--text-dim)" }}>
            These settings are saved locally to your browser and will be applied to every match you join.
          </p>
        </div>
      </div>
    </main>
  );
}
