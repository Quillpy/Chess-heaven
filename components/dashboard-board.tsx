"use client";

import { useEffect, useState, useMemo } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { customPieces } from "@/lib/pieces";

const PGN = `1. d4 Nf6 2. Nf3 e6 3. g3 b5 4. Bg2 Bb7 5. O-O c5 6. Bg5 Qb6 7. a4 a6 8. Nc3 Ne4 9. Nxe4 Bxe4 10. axb5 Qxb5 11. Qd2 f6 12. Bf4 Qb7 13. c4 cxd4 14. Qxd4 e5 15. Bxe5 fxe5 16. Qxe5+ Be7 17. Nd4 Bxg2 18. Nf5 Qb4 19. Kxg2 Nc6 20. Qxg7 O-O-O 21. Rxa6 Qb7 22. Rfa1 Nb4+ 23. Kg1 Nxa6 24. Qxe7 Qb6 25. Qa3 Rhf8 26. Nd6+ Kc7 27. Qxa6 Ra8 28. Qxb6+ Kxb6 29. Rd1 Ra2 30. Rd2 Kc6 31. f3 Rfa8 32. Nb5 R8a4 33. Rc2 Kc5 34. Nc3 Ra1+ 35. Kf2 Rxc4 36. Rd2 Ra7 37. e4 Kc6 38. Ke3 Rb7 39. Rc2 d6 40. Kd3 Rb5 41. f4 Rbb4 42. g4 Kd7 43. g5 Ke6 44. h4 d5 45. Nxd5 Rxc2 46. Nxb4 Rxb2 47. Nc2 Rb3+ 48. Kc4 Rh3 49. Nd4+ Kf7 50. f5 Rxh4 51. Kd5 Rg4 52. Nf3 Rg3 53. Ne5+ Kg8 54. f6 Rxg5 55. Ke6 Rg1 56. f7+ Kg7 57. Nd7 Rf1 58. f8=Q+ Rxf8 59. Nxf8 h6 60. Nd7 h5 61. Ne5 h4 62. Nf3 1-0`;

export function DashboardBoard() {
  const [moveIndex, setMoveIndex] = useState(0);

  const moves = useMemo(() => {
    const tempGame = new Chess();
    tempGame.loadPgn(PGN);
    return tempGame.history();
  }, []);

  const { fen, isCheck, kingSquare, isGameOver } = useMemo(() => {
    const tempGame = new Chess();
    for (let i = 0; i < moveIndex; i++) {
      tempGame.move(moves[i]);
    }
    const check = tempGame.inCheck();
    let kSq = null;
    if (check) {
      const board = tempGame.board();
      for (const row of board) {
        for (const sq of row) {
          if (sq && sq.type === "k" && sq.color === tempGame.turn()) {
            kSq = sq.square;
            break;
          }
        }
      }
    }
    return { 
      fen: tempGame.fen(), 
      isCheck: check, 
      kingSquare: kSq,
      isGameOver: moveIndex === moves.length 
    };
  }, [moveIndex, moves]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMoveIndex((prev) => (prev + 1) % (moves.length + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [moves.length]);

  const boardStyles = useMemo(() => {
    const styles: Record<string, any> = {};
    if (isCheck && kingSquare) {
      styles[kingSquare] = {
        background: "radial-gradient(circle, rgba(255,0,0,0.4) 0%, rgba(255,0,0,0.7) 100%)",
        borderRadius: "50%"
      };
    }
    return styles;
  }, [isCheck, kingSquare]);

  return (
    <div className="card" style={{ padding: 16, height: "100%", display: "flex", flexDirection: "column", position: "relative" }}>
      <p className="eyebrow" style={{ marginBottom: 16 }}>Immortal Replay</p>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 420, pointerEvents: "none" }}>
          <Chessboard
            options={{
              position: fen,
              boardOrientation: "white",
              darkSquareStyle: { backgroundColor: "#0D0E2B" },
              lightSquareStyle: { backgroundColor: "#23244D" },
              pieces: customPieces,
              boardStyle: { borderRadius: 4, boxShadow: "0 5px 15px rgba(0,0,0,0.3)" },
              showNotation: false,
              squareStyles: boardStyles
            }}
          />
        </div>
      </div>

      {isGameOver && (
        <div className="victory-overlay" style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
          borderRadius: "inherit",
          animation: "fadeIn 0.5s ease"
        }}>
          <h3 style={{ fontSize: 24, fontWeight: 800, color: "var(--accent)" }}>Tal Wins!</h3>
          <p style={{ color: "white", fontSize: 14 }}>Checkmate</p>
        </div>
      )}

      <div style={{ marginTop: 16, textAlign: "center" }}>
        <p style={{ fontSize: 14, fontWeight: 700 }}>Tal vs Lautier</p>
        <p style={{ fontSize: 12, color: "var(--text-dim)" }}>Barcelona, 1992</p>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
