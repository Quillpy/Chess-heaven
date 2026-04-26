"use client";

import { Chessboard } from "react-chessboard";
import { useEffect, useMemo, useState } from "react";
import type { GameView } from "@/lib/types";
import { formatClock } from "@/lib/utils";

const themes = [
  { name: "Classic", light: "#f3ebe2", dark: "#746253", accent: "#22c55e" },
  { name: "Blue", light: "#e9f3ff", dark: "#4c6684", accent: "#3b82f6" },
  { name: "Green", light: "#f7f0d8", dark: "#596a3b", accent: "#84cc16" }
];

type Props = {
  initialGame: GameView;
};

export function GameRoom({ initialGame }: Props) {
  const [game, setGame] = useState(initialGame);
  const [themeIndex, setThemeIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const theme = themes[themeIndex];

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("chess-heaven-theme");
    const storedFlip = window.localStorage.getItem("chess-heaven-flip");
    if (storedTheme) setThemeIndex(Number(storedTheme));
    if (storedFlip) setFlipped(storedFlip === "true");
  }, []);

  useEffect(() => {
    window.localStorage.setItem("chess-heaven-theme", String(themeIndex));
  }, [themeIndex]);

  useEffect(() => {
    window.localStorage.setItem("chess-heaven-flip", String(flipped));
  }, [flipped]);

  useEffect(() => {
    const id = window.setInterval(async () => {
      const res = await fetch(`/api/games/${game.code}`, { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setGame(data.game);
    }, 2000);
    return () => window.clearInterval(id);
  }, [game.code]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const whiteClock = useMemo(() => {
    if (game.status !== "live" || game.activeColor !== "white" || !game.lastMoveAt) return game.clocks.whiteMs;
    return Math.max(0, game.clocks.whiteMs - (now - new Date(game.lastMoveAt).getTime()));
  }, [game, now]);

  const blackClock = useMemo(() => {
    if (game.status !== "live" || game.activeColor !== "black" || !game.lastMoveAt) return game.clocks.blackMs;
    return Math.max(0, game.clocks.blackMs - (now - new Date(game.lastMoveAt).getTime()));
  }, [game, now]);

  async function refresh() {
    const res = await fetch(`/api/games/${game.code}`, { cache: "no-store" });
    const data = await res.json();
    if (res.ok) setGame(data.game);
  }

  async function handleJoin() {
    setBusy(true);
    const res = await fetch(`/api/games/${game.code}/join`, { method: "POST" });
    const data = await res.json();
    setBusy(false);
    if (res.ok) setGame(data.game);
  }

  async function handleMove(from: string, to: string, piece: string) {
    setBusy(true);
    const promotion = piece.toLowerCase().endsWith("p") ? "q" : undefined;
    const res = await fetch(`/api/games/${game.code}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, promotion })
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      setGame(data.game);
      return true;
    }
    await refresh();
    return false;
  }

  const canJoin = game.status === "waiting" && game.youAre === null;
  const boardOrientation = flipped ? (game.youAre === "white" ? "black" : "white") : game.youAre ?? "white";

  return (
    <div style={{ display: "grid", gap: 24, gridTemplateColumns: "minmax(0, 1fr) 320px" }} className="game-layout">
      <div className="card" style={{ padding: 16 }}>
        <div style={{ aspectRatio: "1", maxWidth: 520, margin: "0 auto" }}>
          <Chessboard
            options={{
              position: game.fen,
              onPieceDrop: ({ sourceSquare, targetSquare, piece }) => {
                if (!targetSquare) return false;
                void handleMove(sourceSquare, targetSquare, piece.pieceType);
                return true;
              },
              boardOrientation: boardOrientation,
              allowDragging: game.isYourTurn && !busy,
              darkSquareStyle: { backgroundColor: theme.dark },
              lightSquareStyle: { backgroundColor: theme.light },
              boardStyle: { borderRadius: 16, boxShadow: `0 20px 40px ${theme.accent}15` }
            }}
          />
        </div>
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        <div className="card" style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{game.code}</span>
            <span style={{ 
              fontSize: 12, 
              padding: "4px 10px", 
              borderRadius: 999,
              background: game.status === "live" ? "var(--accent)" : "var(--surface-hover)",
              color: game.status === "live" ? "var(--accent-text)" : "var(--text-dim)"
            }}>
              {game.status}
            </span>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
              <div>
                <p style={{ fontSize: 14 }}>{game.blackPlayer?.username ?? "Waiting"}</p>
                <p style={{ fontSize: 12, color: "var(--text-dim)" }}>Black · {game.blackPlayer?.elo ?? "--"}</p>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 600 }}>{formatClock(blackClock)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
              <div>
                <p style={{ fontSize: 14 }}>{game.whitePlayer?.username ?? "Waiting"}</p>
                <p style={{ fontSize: 12, color: "var(--text-dim)" }}>White · {game.whitePlayer?.elo ?? "--"}</p>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 600 }}>{formatClock(whiteClock)}</span>
            </div>
          </div>

          <div style={{ paddingTop: 8, borderTop: "1px solid var(--border)" }}>
            <p style={{ fontSize: 13, color: "var(--text-dim)", textAlign: "center" }}>
              {game.status === "finished"
                ? `${game.result === "draw" ? "Draw" : `${game.result} won`}`
                : game.status === "waiting"
                  ? "Waiting for opponent"
                  : game.isYourTurn
                    ? "Your turn"
                    : "Opponent's turn"}
            </p>
            {canJoin && (
              <button className="btn btn-primary" onClick={handleJoin} disabled={busy} style={{ width: "100%", marginTop: 12 }}>
                {busy ? "Joining..." : "Join game"}
              </button>
            )}
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Board theme</h3>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {themes.map((t, i) => (
              <button
                key={t.name}
                onClick={() => setThemeIndex(i)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  border: i === themeIndex ? `2px solid var(--accent)` : "2px solid transparent",
                  background: `linear-gradient(135deg, ${t.light} 50%, ${t.dark} 50%)`,
                  cursor: "pointer"
                }}
                title={t.name}
              />
            ))}
          </div>
          <button className="btn btn-secondary" onClick={() => setFlipped(f => !f)} style={{ width: "100%" }}>
            {flipped ? "White bottom" : "Black bottom"}
          </button>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Moves</h3>
          <div style={{ maxHeight: 180, overflow: "auto", display: "grid", gap: 4 }}>
            {game.moves.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--text-dim)" }}>No moves yet</p>
            ) : (
              game.moves.map((move, i) => (
                <span key={i} style={{ fontSize: 13, fontFamily: "var(--font-mono)" }}>
                  {i + 1}. {move}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}