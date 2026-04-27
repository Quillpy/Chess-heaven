"use client";

import { useTheme } from "./theme-provider";
import type { AppThemeName } from "@/lib/types";

const appThemes: { name: AppThemeName; label: string; color: string }[] = [
  { name: "default", label: "Default Dark", color: "#22c55e" },
  { name: "neon", label: "Neon Purple", color: "#a855f7" },
  { name: "ocean", label: "Ocean Blue", color: "#06b6d4" },
  { name: "sunset", label: "Sunset Orange", color: "#f97316" },
  { name: "forest", label: "Forest Green", color: "#22c55e" },
  { name: "midnight", label: "Midnight Indigo", color: "#818cf8" },
  { name: "crimson", label: "Crimson Red", color: "#ef4444" },
  { name: "sapphire", label: "Sapphire Blue", color: "#3b82f6" },
  { name: "emerald", label: "Emerald", color: "#10b981" },
  { name: "rose", label: "Rose Pink", color: "#ec4899" },
  { name: "amber", label: "Amber Gold", color: "#eab308" },
];

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>App Theme</h3>
      <select
        className="select"
        value={theme}
        onChange={(e) => setTheme(e.target.value as AppThemeName)}
      >
        {appThemes.map((t) => (
          <option key={t.name} value={t.name}>
            {t.label}
          </option>
        ))}
      </select>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(32px, 1fr))",
          gap: 8,
          marginTop: 4,
        }}
      >
        {appThemes.map((t) => (
          <button
            key={t.name}
            onClick={() => setTheme(t.name)}
            title={t.label}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border:
                t.name === theme
                  ? `2px solid var(--text)`
                  : "2px solid var(--border)",
              background: t.color,
              cursor: "pointer",
              transition: "transform 0.1s ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}