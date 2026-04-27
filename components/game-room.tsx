"use client";

import { Chessboard } from "react-chessboard";
import { Chess, type Square } from "chess.js";
import { memo, useEffect, useMemo, useState, useCallback } from "react";
import type { CSSProperties } from "react";
import type { GameView } from "@/lib/types";
import { formatClock, cn } from "@/lib/utils";

const themes = [
  { name: "Classic", light: "#f3ebe2", dark: "#746253", accent: "#22c55e" },
  { name: "Blue", light: "#e9f3ff", dark: "#4c6684", accent: "#3b82f6" },
  { name: "Green", light: "#f7f0d8", dark: "#596a3b", accent: "#84cc16" },
  { name: "Wood", light: "#deb887", dark: "#8b4513", accent: "#d2691e" },
  { name: "Neon", light: "#1a1a2e", dark: "#16213e", accent: "#e94560" },
  { name: "Midnight", light: "#1a1a3c", dark: "#0a0a1f", accent: "#6366f1" },
  { name: "Ocean", light: "#e0f7fa", dark: "#006994", accent: "#00bcd4" },
  { name: "Lava", light: "#fffaf0", dark: "#8b0000", accent: "#ff4500" },
  { name: "Gold", light: "#fffacd", dark: "#8b7500", accent: "#ffd700" }
] as const;

const promotionPieces = [
  { type: "q", label: "Queen" },
  { type: "r", label: "Rook" },
  { type: "b", label: "Bishop" },
  { type: "n", label: "Knight" }
] as const;

type Props = {
  initialGame: GameView;
};

type MoveMap = Record<string, string[]>;

function buildMoveMap(fen: string) {
  try {
    const chess = new Chess(fen);
    const moves: MoveMap = {};
    const files = "abcdefgh";
    const ranks = "87654321";
    for (const file of files) {
      for (const rank of ranks) {
        const square = `${file}${rank}` as Square;
        const nextMoves = chess.moves({ square, verbose: true });
        if (nextMoves.length > 0) {
          moves[square] = nextMoves.map((move) => move.to);
        }
      }
    }
    return moves;
  } catch {
    return {};
  }
}

const ClockCard = memo(function ClockCard({
  label,
  player,
  isActive,
  isBottom,
  baseMs,
  lastMoveAt,
  isFlagged
}: {
  label: "White" | "Black";
  player: GameView["whitePlayer"] | GameView["blackPlayer"];
  isActive: boolean;
  isBottom: boolean;
  baseMs: number;
  lastMoveAt: string | null;
  isFlagged: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isActive || !lastMoveAt) return;
    const timerId = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(timerId);
  }, [isActive, lastMoveAt]);

  useEffect(() => {
    setNow(Date.now());
  }, [baseMs, isActive, lastMoveAt]);

  const remainingMs = useMemo(() => {
    if (!isActive || !lastMoveAt) return baseMs;
    return Math.max(0, baseMs - (now - new Date(lastMoveAt).getTime()));
  }, [baseMs, isActive, lastMoveAt, now]);

  const isLowTime = remainingMs < 10000 && !isFlagged;

  return (
    <div
      className={cn("player-strip", isActive && "active-turn", isLowTime && "low-time")}
      style={{ order: isBottom ? 2 : 1 }}
    >
      <div className="player-info">
        <div className="player-avatar" style={{ overflow: "hidden" }}>
           {player?.imageUrl && <img src={player.imageUrl} alt="" style={{ width: "100%", height: "100%" }} />}
        </div>
        <div>
          <p className="player-username">{player?.username ?? "Waiting..."}</p>
          <p className="player-elo">
            {label} · {player?.elo ?? "----"}
          </p>
        </div>
      </div>
      <span className="player-clock">
        {formatClock(remainingMs)}
      </span>
    </div>
  );
});

const MoveList = memo(function MoveList({ moves }: { moves: string[] }) {
  return (
    <div className="move-list-container card">
      <p className="eyebrow" style={{ marginBottom: 12 }}>Match History</p>
      <div className="move-list">
        {moves.length === 0 ? (
          <p className="empty-text">No moves yet</p>
        ) : (
          Array.from({ length: Math.ceil(moves.length / 2) }).map((_, i) => (
            <div key={i} className="move-pair">
              <span className="move-number">{i + 1}.</span>
              <span className="move-san">{moves[i * 2]}</span>
              {moves[i * 2 + 1] && <span className="move-san">{moves[i * 2 + 1]}</span>}
            </div>
          ))
        )}
      </div>
    </div>
  );
});

export function GameRoom({ initialGame }: Props) {
  const [game, setGame] = useState(initialGame);
  const [themeIndex, setThemeIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [showPromotion, setShowPromotion] = useState(false);
  const [promotionSquare, setPromotionSquare] = useState<Square | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const theme = themes[themeIndex] ?? themes[0];
  const legalMoves = useMemo(() => buildMoveMap(game.fen), [game.fen]);
  const boardOrientation = flipped
    ? game.youAre === "white"
      ? "black"
      : "white"
    : game.youAre ?? "white";

  const canJoin = game.status === "waiting" && game.youAre === null;
  const showDrawOffer = game.status === "live" && game.drawOfferedBy && game.drawOfferedBy !== game.youAre;

  const statusText = useMemo(() => {
    if (game.status === "finished") return game.resultReason ?? "Game Over";
    if (game.status === "waiting") return "Waiting for opponent...";
    return game.isYourTurn ? "Your turn" : "Opponent thinking...";
  }, [game.status, game.resultReason, game.isYourTurn]);

  const boardStyles = useMemo(() => {
    const styles: Record<string, CSSProperties> = {};
    if (selectedSquare) {
      styles[selectedSquare] = { backgroundColor: `${theme.accent}45` };
      for (const square of legalMoves[selectedSquare] ?? []) {
        styles[square] = { 
          background: `radial-gradient(circle, ${theme.accent}35 25%, transparent 25%)`,
          cursor: "pointer"
        };
      }
    }
    return styles;
  }, [legalMoves, selectedSquare, theme.accent]);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("chess-heaven-board-theme");
    const storedFlip = window.localStorage.getItem("chess-heaven-flip");
    if (storedTheme) {
      const idx = Number(storedTheme);
      if (themes[idx]) setThemeIndex(idx);
    }
    if (storedFlip) setFlipped(storedFlip === "true");
  }, []);

  useEffect(() => {
    window.localStorage.setItem("chess-heaven-board-theme", String(themeIndex));
  }, [themeIndex]);

  useEffect(() => {
    window.localStorage.setItem("chess-heaven-flip", String(flipped));
  }, [flipped]);

  useEffect(() => {
    const eventSource = new EventSource(`/api/games/${initialGame.code}/stream`);
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data) as { game: GameView };
      setGame((curr) => {
        if (curr.updatedAt === data.game.updatedAt && curr.lastMoveAt === data.game.lastMoveAt) return curr;
        return data.game;
      });
      setError(null);
    };
    eventSource.onerror = () => eventSource.close();
    return () => eventSource.close();
  }, [initialGame.code]);

  const copy = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const refresh = async () => {
    const res = await fetch(`/api/games/${game.code}`, { cache: "no-store" });
    const data = await res.json();
    if (res.ok) setGame(data.game);
  };

  const submitMove = async (from: string, to: string, promotion?: string) => {
    setBusy(true);
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
    setError(data.error ?? "Invalid move");
    await refresh();
    return false;
  };

  const handleSquareClick = (square: string) => {
    if (game.status !== "live" || !game.youAre) return;
    
    const sq = square as Square;
    if (selectedSquare && (legalMoves[selectedSquare] ?? []).includes(square)) {
      const piece = new Chess(game.fen).get(selectedSquare);
      if (piece?.type === "p" && (square[1] === "1" || square[1] === "8")) {
        setPromotionSquare(sq);
        setShowPromotion(true);
      } else {
        void submitMove(selectedSquare, square);
        setSelectedSquare(null);
      }
      return;
    }
    
    const piece = new Chess(game.fen).get(sq);
    const isOwn = piece && ((game.activeColor === "white" && piece.color === "w") || (game.activeColor === "black" && piece.color === "b"));
    if (isOwn) setSelectedSquare(sq);
    else setSelectedSquare(null);
  };

  const handlePieceDrop = (sourceSquare: string, targetSquare: string | null) => {
    if (!targetSquare || game.status !== "live" || !game.isYourTurn) return false;
    
    const piece = new Chess(game.fen).get(sourceSquare as Square);
    if (piece?.type === "p" && (targetSquare[1] === "1" || targetSquare[1] === "8")) {
      setSelectedSquare(sourceSquare as Square);
      setPromotionSquare(targetSquare as Square);
      setShowPromotion(true);
      return true;
    }
    
    void submitMove(sourceSquare, targetSquare);
    return true;
  };

  const handleAction = async (endpoint: string, body?: any) => {
    setBusy(true);
    const res = await fetch(`/api/games/${game.code}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) setGame(data.game);
    else setError(data.error ?? "Action failed");
  };

  return (
    <div className="shell">
      <div className="game-container">
        <div className="main-board-area">
          <div className="board-wrapper">
            <ClockCard
              label="Black"
              player={game.blackPlayer}
              isActive={game.status === "live" && game.activeColor === "black"}
              isBottom={boardOrientation === "black"}
              baseMs={game.clocks.blackMs}
              lastMoveAt={game.lastMoveAt}
              isFlagged={game.status === "finished" && game.result === "white" && game.resultReason?.includes("flagged") || false}
            />

            <div className="chessboard-container">
              <Chessboard
                options={{
                  position: game.fen,
                  onSquareClick: ({ square }) => handleSquareClick(square),
                  onPieceDrop: ({ sourceSquare, targetSquare }) => handlePieceDrop(sourceSquare, targetSquare),
                  boardOrientation: boardOrientation,
                  darkSquareStyle: { backgroundColor: theme.dark },
                  lightSquareStyle: { backgroundColor: theme.light },
                  squareStyles: boardStyles,
                  boardStyle: { borderRadius: 8 },
                  animationDurationInMs: 200,
                  allowDragging: game.isYourTurn && !busy
                }}
              />

              {showPromotion && (
                <div className="promotion-modal">
                  <div className="promotion-options">
                    {promotionPieces.map((p) => (
                      <button key={p.type} className="promotion-btn" onClick={() => {
                        void submitMove(selectedSquare!, promotionSquare!, p.type);
                        setShowPromotion(false);
                        setSelectedSquare(null);
                        setPromotionSquare(null);
                      }}>
                        {p.type.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {game.status === "finished" && (
                <div className="game-over-overlay">
                  <div className="game-over-card">
                    <h2 style={{ fontSize: 28, fontWeight: 800 }}>
                      {game.result === "draw" ? "Draw" : `${game.result?.toUpperCase()} Wins`}
                    </h2>
                    <p style={{ color: "var(--text-dim)" }}>{game.resultReason}</p>
                    <button className="btn btn-primary" onClick={() => window.location.href = "/dashboard"}>
                      Exit to Dashboard
                    </button>
                  </div>
                </div>
              )}
            </div>

            <ClockCard
              label="White"
              player={game.whitePlayer}
              isActive={game.status === "live" && game.activeColor === "white"}
              isBottom={boardOrientation === "white"}
              baseMs={game.clocks.whiteMs}
              lastMoveAt={game.lastMoveAt}
              isFlagged={game.status === "finished" && game.result === "black" && game.resultReason?.includes("flagged") || false}
            />
          </div>
        </div>

        <div className="sidebar">
          <div className="card sidebar-card">
            <div className="sidebar-header">
              <div>
                <p className="eyebrow">Room {game.code}</p>
                <h3 className={cn("status-text", game.isYourTurn && "accent")}>{statusText}</h3>
              </div>
              <button className="btn-secondary" style={{ padding: 8 }} onClick={() => copy(window.location.href, "Link")} title="Copy Link">
                {copied === "Link" ? "✓" : "🔗"}
              </button>
            </div>

            {error && <div className="error-toast">{error}</div>}

            <div className="action-grid">
              {canJoin ? (
                <button className="btn btn-primary full-width" onClick={() => void handleAction("join")} disabled={busy}>Join Match</button>
              ) : game.status === "live" && game.youAre ? (
                <>
                  {showDrawOffer ? (
                    <button className="btn btn-primary" onClick={() => void handleAction("draw", { action: "accept" })} disabled={busy}>Accept Draw</button>
                  ) : (
                    <button className="btn btn-secondary" onClick={() => void handleAction("draw", { action: "offer" })} disabled={busy}>Offer Draw</button>
                  )}
                  <button className="btn btn-danger" onClick={() => confirm("Resign?") && handleAction("resign")} disabled={busy}>Resign</button>
                </>
              ) : null}
            </div>

            <div className="meta-info">
               <div className="meta-row">
                  <span>Time Control</span>
                  <span>{game.timeControl.whiteMs / 60000}m + {game.timeControl.incrementMs / 1000}s</span>
               </div>
               <div className="meta-row">
                  <span>Match Status</span>
                  <span>{game.status.toUpperCase()}</span>
               </div>
            </div>
          </div>

          <MoveList moves={game.moves} />

          <div className="card sidebar-card">
             <p className="eyebrow" style={{ marginBottom: 12 }}>Board Theme</p>
             <div className="theme-selector">
                {themes.map((t, i) => (
                  <button
                    key={t.name}
                    className={cn("theme-dot", i === themeIndex && "active")}
                    style={{ background: `linear-gradient(135deg, ${t.light} 50%, ${t.dark} 50%)` }}
                    onClick={() => setThemeIndex(i)}
                    title={t.name}
                  />
                ))}
             </div>
             <button className="btn btn-secondary full-width" style={{ marginTop: 12 }} onClick={() => setFlipped(!flipped)}>
               Rotate Board
             </button>
          </div>

          <div className="sidebar-footer">
             <button className="btn-text" onClick={() => copy(game.fen, "FEN")}>{copied === "FEN" ? "FEN Copied" : "Copy FEN"}</button>
             <button className="btn-text" onClick={() => copy(game.pgn, "PGN")}>{copied === "PGN" ? "PGN Copied" : "Copy PGN"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
