"use client";

import { Chessboard } from "react-chessboard";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import type { GameView } from "@/lib/types";
import { formatClock } from "@/lib/utils";
import { Chess, type Square } from "chess.js";

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

const promotionPieces = ["q", "r", "b", "n"];

type Props = {
  initialGame: GameView;
};

export function GameRoom({ initialGame }: Props) {
  const [game, setGame] = useState(initialGame);
  const [themeIndex, setThemeIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [premove, setPremove] = useState<{ from: string; to: string } | null>(null);
  const [showPromotion, setShowPromotion] = useState(false);
  const [promotionSquare, setPromotionSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);
  const chessRef = useRef(new Chess());
  const theme = themes[themeIndex];

  function getLegalMoves(fen: string) {
    const chess = new Chess(fen);
    const moves: Record<string, string[]> = {};
    const files = "abcdefgh";
    const ranks = "87654321";
    for (const file of files) {
      for (const rank of ranks) {
        const sq = file + rank;
        const ms = chess.moves({ square: sq as Square, verbose: true });
        if (ms.length) moves[sq] = ms.map(m => m.to);
      }
    }
    return moves;
  }

  useEffect(() => {
    chessRef.current.load(initialGame.fen);
    setLegalMoves(getLegalMoves(initialGame.fen));
  }, []);

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
    const eventSource = new EventSource(`/api/games/${game.code}/stream`);
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setGame(data.game);
      chessRef.current.load(data.game.fen);
      const files = "abcdefgh";
      const ranks = "87654321";
      const moves: Record<string, string[]> = {};
      for (const file of files) {
        for (const rank of ranks) {
          const sq = file + rank;
          const ms = chessRef.current.moves({ square: sq as Square, verbose: true });
          if (ms.length) moves[sq] = ms.map(m => m.to);
        }
      }
      setLegalMoves(moves);
      setSelectedSquare(null);
      setShowPromotion(false);
      setPremove(null);
    };
    return () => eventSource.close();
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

  async function submitMove(from: string, to: string, promotion?: string) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/games/${game.code}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, promotion })
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      setGame(data.game);
      setPremove(null);
      return true;
    }
    setError(data.error);
    await refresh();
    return false;
  }

  async function handlePremove() {
    if (!premove) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/games/${game.code}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(premove)
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      setGame(data.game);
      setPremove(null);
    }
  }

  function handlePreMove(from: string, to: string) {
    if (game.isYourTurn && !busy) {
      const ranks = game.fen.split(" ")[0].split("/");
      const rankIndex = 8 - Number(from[1]);
      const rank = ranks[rankIndex] ?? "";
      const fileIndex = from.charCodeAt(0) - 97;
      let piece = "";
      let idx = 0;
      for (let i = 0; i < rank.length && idx <= fileIndex; i++) {
        const c = rank[i];
        if (c >= "1" && c <= "8") {
          idx += Number(c);
        } else {
          if (idx === fileIndex) {
            piece = c;
            break;
          }
          idx++;
        }
      }
      if (piece?.toLowerCase() === "p" && (to[1] === "1" || to[1] === "8")) {
        setPromotionSquare(to);
        setSelectedSquare(from);
        setShowPromotion(true);
      } else {
        submitMove(from, to);
      }
    } else {
      setPremove({ from, to });
    }
  }

  const handleSquareClick = useCallback((square: string) => {
    if (!game.isYourTurn || busy) return;
    
    if (selectedSquare) {
      if (legalMoves[selectedSquare]?.includes(square)) {
        handlePreMove(selectedSquare, square);
        setSelectedSquare(null);
      } else {
        setSelectedSquare(square);
      }
    } else {
      setSelectedSquare(square);
    }
  }, [selectedSquare, legalMoves, game.isYourTurn, busy]);

  async function handlePromotion(piece: string) {
    if (!selectedSquare || !promotionSquare) return;
    await submitMove(selectedSquare, promotionSquare, piece);
    setShowPromotion(false);
    setPromotionSquare(null);
    setSelectedSquare(null);
  }

  async function handleResign() {
    if (!confirm("Are you sure you want to resign?")) return;
    setBusy(true);
    const res = await fetch(`/api/games/${game.code}/resign`, { method: "POST" });
    const data = await res.json();
    setBusy(false);
    if (res.ok) setGame(data.game);
    else setError(data.error);
  }

  async function handleOfferDraw() {
    setBusy(true);
    const res = await fetch(`/api/games/${game.code}/draw`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "offer" })
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) setGame(data.game);
    else setError(data.error);
  }

  async function handleAcceptDraw() {
    setBusy(true);
    const res = await fetch(`/api/games/${game.code}/draw`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "accept" })
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) setGame(data.game);
    else setError(data.error);
  }

  const canJoin = game.status === "waiting" && game.youAre === null;
  const boardOrientation = flipped ? (game.youAre === "white" ? "black" : "white") : game.youAre ?? "white";
  const showDrawOffer = game.status === "live" && game.drawOfferedBy && game.drawOfferedBy !== game.youAre;

  const squareStyles: Record<string, React.CSSProperties> = {};
  if (selectedSquare) {
    squareStyles[selectedSquare] = { backgroundColor: `${theme.accent}40` };
  }
  if (selectedSquare && legalMoves[selectedSquare]) {
    legalMoves[selectedSquare].forEach(sq => {
      squareStyles[sq] = { ...squareStyles[sq], backgroundColor: `${theme.accent}30` };
    });
  }
  if (premove) {
    squareStyles[premove.from] = { ...squareStyles[premove.from], backgroundColor: "#fbbf24" };
    squareStyles[premove.to] = { ...squareStyles[premove.to], backgroundColor: "#fbbf2420" };
  }

  return (
    <div style={{ display: "grid", gap: 24, gridTemplateColumns: "minmax(0, 1fr) 320px" }} className="game-layout">
      <div className="card" style={{ padding: 16, position: "relative" }}>
        <div style={{ aspectRatio: "1", maxWidth: 520, margin: "0 auto", position: "relative" }}>
          <Chessboard
            options={{
              position: game.fen,
              onSquareClick: ({ square }) => handleSquareClick(square),
              boardOrientation: boardOrientation,
              allowDragging: game.isYourTurn && !busy,
              darkSquareStyle: { backgroundColor: theme.dark },
              lightSquareStyle: { backgroundColor: theme.light },
              squareStyles,
              boardStyle: { borderRadius: 16, boxShadow: `0 20px 40px ${theme.accent}15` }
            }}
          />
          {showPromotion && promotionSquare && (
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              alignItems: "center",
              justifyItems: "center",
              pointerEvents: "none"
            }}>
              {promotionPieces.map(p => (
                <div key={p} style={{ pointerEvents: "auto" }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => handlePromotion(p)}
                    style={{ width: 48, height: 48, fontSize: 24, padding: 0 }}
                  >
                    {game.youAre === "white" ? p.toUpperCase() : p}
                  </button>
                </div>
              ))}
            </div>
          )}
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
                ? `${game.result === "draw" ? "Draw" : `${game.result} won`} - ${game.resultReason}`
                : game.status === "waiting"
                  ? "Waiting for opponent"
                  : game.isYourTurn
                    ? "Your turn"
                    : "Opponent's turn"}
            </p>
            {error && <p style={{ fontSize: 12, color: "var(--danger)", textAlign: "center", marginTop: 8 }}>{error}</p>}
            {canJoin && (
              <button className="btn btn-primary" onClick={handleJoin} disabled={busy} style={{ width: "100%", marginTop: 12 }}>
                {busy ? "Joining..." : "Join game"}
              </button>
            )}
            {game.status === "live" && !game.isYourTurn && premove && (
              <button className="btn btn-secondary" onClick={handlePremove} style={{ width: "100%", marginTop: 12 }}>
                Cancel premove
              </button>
            )}
          </div>
        </div>

        {game.status === "live" && game.youAre && (
          <div className="card">
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Game actions</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {showDrawOffer ? (
                <button className="btn btn-primary" onClick={handleAcceptDraw} disabled={busy} style={{ gridColumn: "1 / -1" }}>
                  Accept Draw
                </button>
              ) : (
                <button className="btn btn-secondary" onClick={handleOfferDraw} disabled={busy}>
                  Offer Draw
                </button>
              )}
              <button className="btn btn-secondary" style={{ background: "var(--danger)", color: "white" }} onClick={handleResign} disabled={busy}>
                Resign
              </button>
            </div>
          </div>
        )}

        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Board theme</h3>
          <select
            className="select"
            value={themeIndex}
            onChange={(e) => setThemeIndex(Number(e.target.value))}
            style={{ marginBottom: 12 }}
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
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 6,
              marginBottom: 12,
            }}
          >
            {themes.map((t, i) => (
              <button
                key={t.name}
                onClick={() => setThemeIndex(i)}
                style={{
                  width: "100%",
                  aspectRatio: "1",
                  borderRadius: 6,
                  border: i === themeIndex ? `2px solid var(--accent)` : "2px solid var(--border)",
                  background: `linear-gradient(135deg, ${t.light} 50%, ${t.dark} 50%)`,
                  cursor: "pointer",
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