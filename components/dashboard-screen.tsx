"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import type { AppUser, GameView } from "@/lib/types";
import { formatDate, cn } from "@/lib/utils";
import { ThemeSettings } from "./theme-settings";

type Props = {
  user: AppUser;
  games: GameView[];
};

export function DashboardScreen({ user, games: initialGames }: Props) {
  const router = useRouter();
  const [games] = useState(initialGames);
  const [creatorSide, setCreatorSide] = useState<"white" | "black" | "random">("random");
  const [whiteMinutes, setWhiteMinutes] = useState(10);
  const [blackMinutes, setBlackMinutes] = useState(10);
  const [incrementSeconds, setIncrementSeconds] = useState(5);
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const waitingCount = useMemo(() => games.filter((game) => game.status === "waiting").length, [games]);

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
    router.push(`/play/${code}`);
  }

  return (
    <div className="dashboard-layout">
      <div className="dashboard-top-row">
        <div className="card stat-card">
          <p className="eyebrow">Profile</p>
          <div className="profile-info">
            <img src={user.imageUrl} alt="" className="player-avatar" />
            <div>
              <h2>{user.username}</h2>
              <div className="profile-stats">
                <span>Rating: <strong>{user.elo}</strong></span>
                <span>Active: <strong>{waitingCount}</strong></span>
              </div>
            </div>
          </div>
        </div>
        <ThemeSettings />
      </div>

      <div className="dashboard-grid">
        <form className="card form-card" onSubmit={handleCreateGame}>
          <p className="eyebrow">Create Match</p>
          
          <div className="input-group">
            <label>Your Side</label>
            <select className="select" value={creatorSide} onChange={(e) => setCreatorSide(e.target.value as any)}>
              <option value="random">Random</option>
              <option value="white">White</option>
              <option value="black">Black</option>
            </select>
          </div>

          <div className="input-row">
            <div className="input-group">
              <label>White (min)</label>
              <input className="input" type="number" min={1} max={180} value={whiteMinutes} onChange={(e) => setWhiteMinutes(Number(e.target.value))} />
            </div>
            <div className="input-group">
              <label>Black (min)</label>
              <input className="input" type="number" min={1} max={180} value={blackMinutes} onChange={(e) => setBlackMinutes(Number(e.target.value))} />
            </div>
          </div>

          <div className="input-group">
            <label>Increment (sec)</label>
            <input className="input" type="number" min={0} max={60} value={incrementSeconds} onChange={(e) => setIncrementSeconds(Number(e.target.value))} />
          </div>

          <button className="btn btn-primary full-width" type="submit" disabled={busy}>
            {busy ? "Creating..." : "Create Game"}
          </button>
        </form>

        <form className="card form-card" onSubmit={handleJoinGame}>
          <p className="eyebrow">Join Match</p>
          <div className="input-group">
            <label>Invite Code</label>
            <input 
              className="input code-input" 
              placeholder="ABCD1234" 
              value={joinCode} 
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            />
          </div>
          <button className="btn btn-secondary full-width" type="submit" disabled={busy}>
            Join Game
          </button>
          {error && <div className="error-toast">{error}</div>}
        </form>

        <div className="card recent-games-card">
          <p className="eyebrow">Recent Activity</p>
          <div className="games-list">
            {games.length === 0 ? (
              <p className="empty-text">No games yet</p>
            ) : (
              games.map((game) => (
                <Link key={game.code} href={`/play/${game.code}`} className="game-item">
                  <div className="game-item-header">
                    <span className="game-code">{game.code}</span>
                    <span className={cn("game-status-tag", game.status)}>{game.status}</span>
                  </div>
                  <div className="game-players">
                    {game.whitePlayer?.username ?? "???"} vs {game.blackPlayer?.username ?? "???"}
                  </div>
                  <div className="game-meta">
                    {game.timeControl.whiteMs / 60000}m + {game.timeControl.incrementMs / 1000}s · {formatDate(game.updatedAt)}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
