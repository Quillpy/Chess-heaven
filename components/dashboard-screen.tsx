"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import type { AppUser, GameView } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type Props = {
  user: AppUser;
  games: GameView[];
};

export function DashboardScreen({ user, games: initialGames }: Props) {
  const router = useRouter();
  const [games, setGames] = useState(initialGames);
  const [creatorSide, setCreatorSide] = useState<"white" | "black" | "random">("random");
  const [whiteMinutes, setWhiteMinutes] = useState(10);
  const [blackMinutes, setBlackMinutes] = useState(10);
  const [incrementSeconds, setIncrementSeconds] = useState(5);
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const waitingCount = useMemo(() => games.filter((game) => game.status === "waiting").length, [games]);

  async function refreshGames() {
    const response = await fetch("/api/games");
    const data = await response.json();
    if (response.ok) {
      setGames(data.games);
    }
  }

  async function handleCreateGame(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const response = await fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creatorSide, whiteMinutes, blackMinutes, incrementSeconds })
    });

    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setError(data.error ?? "Unable to create game");
      return;
    }

    router.push(`/play/${data.code}`);
  }

  async function handleJoinGame(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!joinCode.trim()) return;
    setBusy(true);
    setError(null);
    const code = joinCode.trim().toUpperCase();
    const response = await fetch(`/api/games/${code}/join`, { method: "POST" });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setError(data.error ?? "Unable to join game");
      return;
    }

    setJoinCode("");
    router.push(`/play/${code}`);
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <p style={{ fontSize: 13, color: "var(--text-dim)" }}>Username</p>
            <p style={{ fontSize: 24, fontWeight: 600 }}>{user.username}</p>
          </div>
          <div style={{ display: "flex", gap: 24, textAlign: "right" }}>
            <div>
              <p style={{ fontSize: 13, color: "var(--text-dim)" }}>Elo</p>
              <p style={{ fontSize: 24, fontWeight: 600, fontFamily: "var(--font-mono)" }}>{user.elo}</p>
            </div>
            <div>
              <p style={{ fontSize: 13, color: "var(--text-dim)" }}>Waiting</p>
              <p style={{ fontSize: 24, fontWeight: 600 }}>{waitingCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
        <form className="card" onSubmit={handleCreateGame} style={{ display: "grid", gap: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>Create game</h2>
          
          <label className="label">
            Your side
            <select className="select" value={creatorSide} onChange={(e) => setCreatorSide(e.target.value as typeof creatorSide)}>
              <option value="random">Random</option>
              <option value="white">White</option>
              <option value="black">Black</option>
            </select>
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label className="label">
              White (min)
              <input className="input" type="number" min={1} max={180} value={whiteMinutes} onChange={(e) => setWhiteMinutes(Number(e.target.value))} />
            </label>
            <label className="label">
              Black (min)
              <input className="input" type="number" min={1} max={180} value={blackMinutes} onChange={(e) => setBlackMinutes(Number(e.target.value))} />
            </label>
          </div>

          <label className="label">
            Increment (sec)
            <input className="input" type="number" min={0} max={180} value={incrementSeconds} onChange={(e) => setIncrementSeconds(Number(e.target.value))} />
          </label>

          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Creating..." : "Create game"}
          </button>
        </form>

        <form className="card" onSubmit={handleJoinGame} style={{ display: "grid", gap: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>Join game</h2>
          
          <label className="label">
            Invite code
            <input 
              className="input" 
              placeholder="ABCD1234" 
              value={joinCode} 
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}
            />
          </label>

          <button className="btn btn-secondary" type="submit" disabled={busy}>
            {busy ? "Joining..." : "Join game"}
          </button>
          
          {error && <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>}
        </form>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Recent games</h2>
        
        {games.length === 0 ? (
          <p style={{ color: "var(--text-dim)", fontSize: 14 }}>No games yet. Create or join a game to get started.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {games.map((game) => (
              <Link 
                key={game.code} 
                href={`/play/${game.code}`}
                style={{ 
                  display: "grid", 
                  gap: 8, 
                  padding: 16, 
                  background: "var(--bg)", 
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 600 }}>{game.code}</span>
                  <span style={{ fontSize: 12, color: game.status === "live" ? "var(--accent)" : "var(--text-dim)" }}>
                    {game.status}
                  </span>
                </div>
                <p style={{ fontSize: 14 }}>
                  {game.whitePlayer?.username ?? "Waiting"} vs {game.blackPlayer?.username ?? "Waiting"}
                </p>
                <p style={{ fontSize: 12, color: "var(--text-dim)" }}>
                  {game.timeControl.whiteMs / 60000}m / {game.timeControl.blackMs / 60000}m · +{game.timeControl.incrementMs / 1000}s · {formatDate(game.updatedAt)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}