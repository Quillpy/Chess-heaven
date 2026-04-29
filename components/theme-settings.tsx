"use client";

import { useTheme } from "./theme-provider";
import type { AppThemeName } from "@/lib/types";
import { cn } from "@/lib/utils";

const appThemes: { name: AppThemeName; label: string; color: string }[] = [
  { name: "default", label: "Default", color: "#3b82f6" },
  { name: "neon", label: "Neon", color: "#a855f7" },
  { name: "ocean", label: "Ocean", color: "#06b6d4" },
  { name: "sunset", label: "Sunset", color: "#f97316" },
  { name: "forest", label: "Forest", color: "#22c55e" },
  { name: "midnight", label: "Midnight", color: "#818cf8" },
  { name: "crimson", label: "Crimson", color: "#ef4444" },
  { name: "sapphire", label: "Sapphire", color: "#3b82f6" },
  { name: "emerald", label: "Emerald", color: "#10b981" },
  { name: "rose", label: "Rose", color: "#ec4899" },
  { name: "amber", label: "Amber", color: "#eab308" },
  { name: "amethyst", label: "Amethyst", color: "#a855f7" },
  { name: "gold", label: "Gold", color: "#ffd700" },
  { name: "slate", label: "Slate", color: "#475569" },
];

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="card theme-card">
      <p className="eyebrow" style={{ marginBottom: 12 }}>App Appearance</p>
      <div className="app-theme-grid">
        {appThemes.map((t) => (
          <button
            key={t.name}
            onClick={() => setTheme(t.name)}
            title={t.label}
            className={cn("theme-swatch", t.name === theme && "active")}
            style={{ backgroundColor: t.color }}
          />
        ))}
      </div>
    </div>
  );
}
