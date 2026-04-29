"use client";

import { Chessboard } from "react-chessboard";
import { Chess, type Square } from "chess.js";
import { memo, useEffect, useMemo, useState, useCallback, useRef } from "react";
import type { CSSProperties } from "react";
import type { GameView } from "@/lib/types";
import { formatClock, cn } from "@/lib/utils";

import { customPieces } from "@/lib/pieces";
import { useTheme } from "@/components/theme-provider";
import type { AppThemeName } from "@/lib/types";

const themes = [
  { name: "Midnight Blue", light: "#23244D", dark: "#0D0E2B", accent: "#6366f1" },
  { name: "Forest Night", light: "#2D4A3E", dark: "#14261F", accent: "#22c55e" },
  { name: "Royal Purple", light: "#3B2C5A", dark: "#1A102D", accent: "#a855f7" },
  { name: "Warm Walnut", light: "#6B4F3A", dark: "#3D2A1D", accent: "#f97316" },
  { name: "Slate Gray", light: "#4B5563", dark: "#1F2937", accent: "#3b82f6" },
  { name: "Deep Ocean", light: "#1B3A4B", dark: "#0D1F2D", accent: "#06b6d4" },
  { name: "Espresso", light: "#4B3832", dark: "#2D1B14", accent: "#d2691e" },
  { name: "Obsidian", light: "#2A2A2A", dark: "#121212", accent: "#e94560" },
  { name: "Rosewood", light: "#5E2B2B", dark: "#3A1616", accent: "#ef4444" }
] as const;

const appThemes: { name: AppThemeName; color: string }[] = [
  { name: "default", color: "#3b82f6" },
  { name: "neon", color: "#a855f7" },
  { name: "ocean", color: "#06b6d4" },
  { name: "sunset", color: "#f97316" },
  { name: "forest", color: "#22c55e" },
  { name: "midnight", color: "#818cf8" },
  { name: "crimson", color: "#ef4444" },
  { name: "sapphire", color: "#3b82f6" },
  { name: "emerald", color: "#10b981" },
  { name: "rose", color: "#ec4899" },
  { name: "amber", color: "#eab308" }
];

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

const playSound = (name: string) => {
  const audio = new Audio(`/Sounds/${name}.mp3`);
  audio.play().catch(() => {});
};

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

  const [rightClickedSquares, setRightClickedSquares] = useState<Record<string, CSSProperties>>({});

  // Sound Effects
  useEffect(() => {
    if (game.status === "live" && initialGame.status === "waiting") {
      playSound("game-start");
    }
  }, [game.status, initialGame.status]);

  useEffect(() => {
    if (game.status === "finished") {
      playSound("game-end");
    }
  }, [game.status]);

  const prevFen = useRef(game.fen);
  useEffect(() => {
    if (game.fen !== prevFen.current) {
      const chess = new Chess(game.fen);
      const history = chess.history({ verbose: true });
      const last = history[history.length - 1];
      
      if (last) {
        if (last.flags.includes("k") || last.flags.includes("q")) {
          playSound("castle");
        } else if (last.flags.includes("c") || last.flags.includes("e")) {
          playSound("capture");
        } else {
          playSound("move-self");
        }
      }
      prevFen.current = game.fen;
    }
  }, [game.fen]);

  const theme = themes[themeIndex] ?? themes[0];
  const legalMoves = useMemo(() => buildMoveMap(game.fen), [game.fen]);
  const boardOrientation = flipped
    ? game.youAre === "white"
      ? "black"
      : "white"
    : game.youAre ?? "white";

  const { lastMove, isCheck, kingSquare } = useMemo(() => {
    const chess = new Chess(game.fen);
    const history = chess.history({ verbose: true });
    const last = history[history.length - 1];
    const check = chess.inCheck();
    let kSq = null;
    if (check) {
      const board = chess.board();
      for (const row of board) {
        for (const sq of row) {
          if (sq && sq.type === "k" && sq.color === chess.turn()) {
            kSq = sq.square;
            break;
          }
        }
      }
    }
    return { lastMove: last, isCheck: check, kingSquare: kSq };
  }, [game.fen]);

  const boardStyles = useMemo(() => {
    const styles: Record<string, CSSProperties> = { ...rightClickedSquares };
    
    // Last move highlight
    if (lastMove) {
      styles[lastMove.from] = { backgroundColor: "rgba(255, 255, 0, 0.3)" };
      styles[lastMove.to] = { backgroundColor: "rgba(255, 255, 0, 0.3)" };
    }

    // Check highlight
    if (isCheck && kingSquare) {
      styles[kingSquare] = {
        background: "radial-gradient(circle, rgba(255,0,0,0.5) 0%, rgba(255,0,0,0.8) 100%)",
        borderRadius: "50%"
      };
    }

    // Selected and Legal moves
    if (selectedSquare) {
      styles[selectedSquare] = { backgroundColor: "rgba(255, 255, 255, 0.2)" };
      for (const square of legalMoves[selectedSquare] ?? []) {
        styles[square] = { 
          background: `radial-gradient(circle, ${theme.accent}40 25%, transparent 25%)`,
          cursor: "pointer"
        };
      }
    }
    return styles;
  }, [lastMove, isCheck, kingSquare, selectedSquare, legalMoves, theme.accent, rightClickedSquares]);

  const canJoin = game.status === "waiting" && game.youAre === null;
  const showDrawOffer = game.status === "live" && game.drawOfferedBy && game.drawOfferedBy !== game.youAre;

  const statusText = useMemo(() => {
    if (game.status === "finished") return game.resultReason ?? "Game Over";
    if (game.status === "waiting") return "Waiting for opponent...";
    return game.isYourTurn ? "Your turn" : "Opponent thinking...";
  }, [game.status, game.resultReason, game.isYourTurn]);

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
    // Optimistic Update
    const chess = new Chess(game.fen);
    try {
      const move = chess.move({ from, to, promotion: promotion as any });
      if (!move) return false;

      const oldGame = game;
      setGame((curr) => ({
        ...curr,
        fen: chess.fen(),
        moves: [...curr.moves, move.san],
        isYourTurn: false,
        activeColor: chess.turn() === "w" ? "white" : "black"
      }));

      const res = await fetch(`/api/games/${game.code}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to, promotion })
      });
      const data = await res.json();
      if (res.ok) {
        setGame(data.game);
        return true;
      }
      
      setError(data.error ?? "Invalid move");
      setGame(oldGame);
      await refresh();
      return false;
    } catch (e) {
      return false;
    }
  };

  const handleSquareClick = (square: string) => {
    setRightClickedSquares({});
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

  const handleSquareRightClick = (square: string) => {
    setRightClickedSquares((prev) => {
      const next = { ...prev };
      if (next[square]) {
        delete next[square];
      } else {
        next[square] = { backgroundColor: "rgba(255, 0, 0, 0.4)" };
      }
      return next;
    });
  };

  const handlePieceDrop = (sourceSquare: string, targetSquare: string | null) => {
    if (!targetSquare || game.status !== "live") return false;
    
    const piece = new Chess(game.fen).get(sourceSquare as Square);
    if (piece?.type === "p" && (targetSquare[1] === "1" || targetSquare[1] === "8")) {
      setSelectedSquare(sourceSquare as Square);
      setPromotionSquare(targetSquare as Square);
      setShowPromotion(true);
      return true;
    }
    
    return void submitMove(sourceSquare, targetSquare) as any;
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

  const { theme: appTheme, setTheme: setAppTheme } = useTheme();

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
                  onSquareRightClick: ({ square }) => handleSquareRightClick(square),
                  onPieceDrop: ({ sourceSquare, targetSquare }) => handlePieceDrop(sourceSquare, targetSquare),
                  boardOrientation: boardOrientation,
                  darkSquareStyle: { backgroundColor: theme.dark },
                  lightSquareStyle: { backgroundColor: theme.light },
                  squareStyles: boardStyles,
                  boardStyle: { borderRadius: 4, boxShadow: "0 5px 15px rgba(0,0,0,0.5)" },
                  animationDurationInMs: 200,
                  allowDragging: game.isYourTurn && !busy,
                  pieces: customPieces
                }}
              />

              {showPromotion && (
                <div className="promotion-modal">
                  <div className="promotion-options">
                    {promotionPieces.map((p) => {
                      const colorPrefix = game.activeColor === "white" ? "w" : "b";
                      const pieceKey = `${colorPrefix}${p.type.toUpperCase()}`;
                      return (
                        <button key={p.type} className="promotion-btn" onClick={() => {
                          void submitMove(selectedSquare!, promotionSquare!, p.type);
                          setShowPromotion(false);
                          setSelectedSquare(null);
                          setPromotionSquare(null);
                        }}>
                          {customPieces[pieceKey]({ svgStyle: { width: 40, height: 40 } })}
                        </button>
                      );
                    })}
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

             <p className="eyebrow" style={{ margin: "20px 0 12px" }}>App Theme</p>
             <div className="theme-selector">
                {appThemes.map((t) => (
                  <button
                    key={t.name}
                    className={cn("theme-dot", appTheme === t.name && "active")}
                    style={{ background: t.color }}
                    onClick={() => setAppTheme(t.name)}
                    title={t.name.charAt(0).toUpperCase() + t.name.slice(1)}
                  />
                ))}
             </div>

             <button className="btn btn-secondary full-width" style={{ marginTop: 20 }} onClick={() => setFlipped(!flipped)}>
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
