"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const themes = [
  { name: "Classic", light: "#f3ebe2", dark: "#746253", accent: "#22c55e" },
  { name: "Blue", light: "#e9f3ff", dark: "#4c6684", accent: "#3b82f6" },
  { name: "Green", light: "#f7f0d8", dark: "#596a3b", accent: "#84cc16" },
  { name: "Wood", light: "#deb887", dark: "#8b4513", accent: "#d2691e" },
  { name: "Marble", light: "#ffffff", dark: "#2c3e50", accent: "#3498db" },
  { name: "Leather", light: "#8b7355", dark: "#3d2817", accent: "#a0522d" },
  { name: "Neon", light: "#1a1a2e", dark: "#16213e", accent: "#e94560" },
  { name: "Purple", light: "#f5f0ff", dark: "#4a3f6b", accent: "#8b5cf6" },
  { name: "Rosewood", light: "#ffe4e1", dark: "#65000b", accent: "#dc143c" },
  { name: "Mint", light: "#f0fff4", dark: "#2d6a4f", accent: "#10b981" },
  { name: "Candy", light: "#fff0f5", dark: "#c71585", accent: "#ff69b4" },
  { name: "Matrix", light: "#001a00", dark: "#000d00", accent: "#00ff00" },
  { name: "Sunset", light: "#ffe4b5", dark: "#8b4513", accent: "#ff6347" },
  { name: "Ice", light: "#e8f4f8", dark: "#4a6fa5", accent: "#00bfff" },
  { name: "Sand", light: "#f5deb3", dark: "#8b7355", accent: "#daa520" },
  { name: "Midnight", light: "#1a1a3c", dark: "#0a0a1f", accent: "#6366f1" },
  { name: "Forest", light: "#f0fff0", dark: "#228b22", accent: "#32cd32" },
  { name: "Ocean", light: "#e0f7fa", dark: "#006994", accent: "#00bcd4" },
  { name: "Lava", light: "#fffaf0", dark: "#8b0000", accent: "#ff4500" },
  { name: "Gold", light: "#fffacd", dark: "#8b7500", accent: "#ffd700" }
];

const globalThemes = [
  { name: "Light", bg: "#ffffff", text: "#1a1a1a", surface: "#f5f5f5", border: "#e0e0e0", accent: "#22c55e" },
  { name: "Dark", bg: "#0a0a0a", text: "#f5f5f5", surface: "#1a1a1a", border: "#2a2a2a", accent: "#22c55e" },
  { name: "System", bg: "system", text: "system", surface: "system", border: "system", accent: "system" }
];

export default function SettingsPage() {
  const [boardThemeIndex, setBoardThemeIndex] = useState(0);
  const [globalThemeIndex, setGlobalThemeIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const storedBoard = window.localStorage.getItem("chess-heaven-theme");
    const storedGlobal = window.localStorage.getItem("chess-heaven-global-theme");
    if (storedBoard) setBoardThemeIndex(Number(storedBoard));
    if (storedGlobal) setGlobalThemeIndex(Number(storedGlobal));
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem("chess-heaven-theme", String(boardThemeIndex));
  }, [boardThemeIndex, loaded]);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem("chess-heaven-global-theme", String(globalThemeIndex));
    const isDark = globalThemeIndex === 1 || (globalThemeIndex === 2 && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  }, [globalThemeIndex, loaded]);

  if (!loaded) return null;

  return (
    <div className="page">
      <div className="topbar">
        <Link href="/dashboard" className="brand">
          Chess Heaven
        </Link>
        <Link href="/dashboard" className="btn btn-secondary" style={{ padding: "8px 14px" }}>
          Dashboard
        </Link>
      </div>

      <main className="shell">
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24 }}>Settings</h1>

        <div className="card" style={{ maxWidth: 600 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Global Theme</h2>
          <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
            {globalThemes.map((t, i) => (
              <button
                key={t.name}
                onClick={() => setGlobalThemeIndex(i)}
                className={`btn ${globalThemeIndex === i ? "btn-primary" : "btn-secondary"}`}
                style={{ flex: 1 }}
              >
                {t.name}
              </button>
            ))}
          </div>

          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Board Theme</h2>
          <select
            className="select"
            value={boardThemeIndex}
            onChange={(e) => setBoardThemeIndex(Number(e.target.value))}
            style={{ marginBottom: 16, width: "100%" }}
          >
            {themes.map((t, i) => (
              <option key={t.name} value={i}>
                {t.name}
              </option>
            ))}
          </select>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 8,
            }}
          >
            {themes.map((t, i) => (
              <button
                key={t.name}
                onClick={() => setBoardThemeIndex(i)}
                style={{
                  width: "100%",
                  aspectRatio: "1",
                  borderRadius: 8,
                  border: i === boardThemeIndex ? `2px solid var(--accent)` : "2px solid var(--border)",
                  background: `linear-gradient(135deg, ${t.light} 50%, ${t.dark} 50%)`,
                  cursor: "pointer",
                }}
                title={t.name}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}