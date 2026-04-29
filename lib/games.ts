import { Chess } from "chess.js";
import { supabase } from "@/lib/supabase";
import type { AppUser, GameDocument, GameView, PublicPlayer, Side } from "@/lib/types";
import { generateGameCode } from "@/lib/utils";

function cloneGame(game: GameDocument): GameDocument {
  return JSON.parse(JSON.stringify(game)) as GameDocument;
}

function getActiveClock(game: GameDocument, nowMs: number) {
  const next = cloneGame(game);

  if (next.status !== "live" || !next.lastMoveAt) {
    return next;
  }

  const elapsed = Math.max(0, nowMs - new Date(next.lastMoveAt).getTime());

  if (next.activeColor === "white") {
    next.clocks.whiteMs = Math.max(0, next.clocks.whiteMs - elapsed);
  } else {
    next.clocks.blackMs = Math.max(0, next.clocks.blackMs - elapsed);
  }

  return next;
}

function hasTimedOut(game: GameDocument, nowMs: number) {
  if (game.status !== "live" || !game.lastMoveAt) {
    return null;
  }

  const elapsed = Math.max(0, nowMs - new Date(game.lastMoveAt).getTime());
  const remaining =
    game.activeColor === "white"
      ? game.clocks.whiteMs - elapsed
      : game.clocks.blackMs - elapsed;

  if (remaining > 0) {
    return null;
  }

  return game.activeColor;
}

async function attachPlayers(game: GameDocument, viewerId: string): Promise<GameView> {
  const ids = [game.whitePlayerId, game.blackPlayerId].filter(Boolean) as string[];
  
  const { data: players } = await supabase
    .from("users")
    .select("clerkId, username, imageUrl, elo")
    .in("clerkId", ids);

  const playerMap = new Map<string, PublicPlayer>(
    (players || []).map((player: any) => [
      player.clerkId,
      {
        clerkId: player.clerkId,
        username: player.username,
        imageUrl: player.imageUrl,
        elo: player.elo
      }
    ])
  );
  
  const youAre = game.whitePlayerId === viewerId ? "white" : game.blackPlayerId === viewerId ? "black" : null;
  return {
    code: game.code,
    status: game.status,
    result: game.result,
    resultReason: game.resultReason,
    fen: game.fen,
    pgn: game.pgn,
    moves: game.moves,
    creatorId: game.creatorId,
    whitePlayer: game.whitePlayerId ? playerMap.get(game.whitePlayerId) ?? null : null,
    blackPlayer: game.blackPlayerId ? playerMap.get(game.blackPlayerId) ?? null : null,
    timeControl: game.timeControl,
    clocks: game.clocks,
    activeColor: game.activeColor,
    lastMoveAt: game.lastMoveAt,
    drawOfferedBy: game.drawOfferedBy,
    drawAcceptedBy: game.drawAcceptedBy,
    halfMoveClock: game.halfMoveClock,
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
    youAre,
    isYourTurn: game.status === "live" && youAre === game.activeColor
  };
}

async function finalizeGame(game: GameDocument, result: GameDocument["result"], resultReason: string) {
  const now = new Date().toISOString();
  
  const clocks = { ...game.clocks };
  if (result === "white" && resultReason.includes("flagged")) clocks.blackMs = 0;
  if (result === "black" && resultReason.includes("flagged")) clocks.whiteMs = 0;

  const { data, error } = await supabase
    .from("games")
    .update({
      status: "finished",
      result,
      resultReason,
      clocks,
      lastMoveAt: null,
      updatedAt: now
    })
    .eq("code", game.code)
    .select()
    .single();

  if (error) {
    console.error("Error finalizing game:", error);
    return game;
  }

  return data as GameDocument;
}

async function syncTimeoutIfNeeded(game: GameDocument) {
  const loser = hasTimedOut(game, Date.now());

  if (!loser) {
    return game;
  }

  const live = getActiveClock(game, Date.now());
  return loser === "white"
    ? finalizeGame(live, "black", "White flagged")
    : finalizeGame(live, "white", "Black flagged");
}

export async function createGame(input: {
  creatorId: string;
  creatorSide: Side | "random";
  whiteMinutes: number;
  blackMinutes: number;
  incrementSeconds: number;
}) {
  const code = generateGameCode();
  const creatorColor =
    input.creatorSide === "random" ? (Math.random() > 0.5 ? "white" : "black") : input.creatorSide;
  const now = new Date().toISOString();
  const whitePlayerId = creatorColor === "white" ? input.creatorId : null;
  const blackPlayerId = creatorColor === "black" ? input.creatorId : null;
  
  const game: Partial<GameDocument> = {
    code,
    status: "waiting",
    result: null,
    resultReason: null,
    fen: new Chess().fen(),
    pgn: "",
    moves: [],
    creatorId: input.creatorId,
    whitePlayerId,
    blackPlayerId,
    timeControl: {
      whiteMs: input.whiteMinutes * 60_000,
      blackMs: input.blackMinutes * 60_000,
      incrementMs: input.incrementSeconds * 1000
    },
    clocks: {
      whiteMs: input.whiteMinutes * 60_000,
      blackMs: input.blackMinutes * 60_000
    },
    activeColor: "white",
    lastMoveAt: null,
    drawOfferedBy: null,
    drawAcceptedBy: null,
    halfMoveClock: 0,
    createdAt: now,
    updatedAt: now
  };

  const { data, error } = await supabase
    .from("games")
    .insert(game)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create game: ${error.message}`);
  }

  return data as GameDocument;
}

export async function joinGame(code: string, playerId: string) {
  const { data: existing, error: fetchError } = await supabase
    .from("games")
    .select("*")
    .eq("code", code)
    .single();

  if (fetchError || !existing) {
    throw new Error("Game not found");
  }

  if (existing.whitePlayerId === playerId || existing.blackPlayerId === playerId) {
    return existing as GameDocument;
  }

  if (existing.status !== "waiting") {
    throw new Error("Game is no longer joinable");
  }

  const now = new Date().toISOString();
  const whitePlayerId = existing.whitePlayerId ?? playerId;
  const blackPlayerId = existing.blackPlayerId ?? playerId;

  const { data, error } = await supabase
    .from("games")
    .update({
      whitePlayerId,
      blackPlayerId,
      status: "live",
      lastMoveAt: now,
      drawOfferedBy: null,
      drawAcceptedBy: null,
      halfMoveClock: 0,
      updatedAt: now
    })
    .eq("code", code)
    .eq("status", "waiting")
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to join game: ${error.message}`);
  }

  return data as GameDocument;
}

export async function getGameForViewer(code: string, viewerId: string) {
  const { data: existing, error } = await supabase
    .from("games")
    .select("*")
    .eq("code", code)
    .single();

  if (error || !existing) {
    return null;
  }

  const synced = await syncTimeoutIfNeeded(existing as GameDocument);
  return attachPlayers(synced, viewerId);
}

export async function submitMove(input: {
  code: string;
  playerId: string;
  from: string;
  to: string;
  promotion?: string;
}) {
  const { data: game, error: fetchError } = await supabase
    .from("games")
    .select("*")
    .eq("code", input.code)
    .single();

  if (fetchError || !game) {
    throw new Error("Game not found");
  }

  const synced = await syncTimeoutIfNeeded(game as GameDocument);

  if (synced.status !== "live") {
    throw new Error("Game is not live");
  }

  const playerSide = synced.whitePlayerId === input.playerId ? "white" : synced.blackPlayerId === input.playerId ? "black" : null;

  if (!playerSide) {
    throw new Error("You are not part of this game");
  }

  if (playerSide !== synced.activeColor) {
    throw new Error("It is not your turn");
  }

  const elapsed = synced.lastMoveAt ? Date.now() - new Date(synced.lastMoveAt).getTime() : 0;
  const whiteMs = synced.activeColor === "white" ? Math.max(0, synced.clocks.whiteMs - elapsed) : synced.clocks.whiteMs;
  const blackMs = synced.activeColor === "black" ? Math.max(0, synced.clocks.blackMs - elapsed) : synced.clocks.blackMs;

  if (whiteMs === 0) {
    return attachPlayers(await finalizeGame({ ...synced, clocks: { whiteMs, blackMs } }, "black", "White flagged"), input.playerId);
  }

  if (blackMs === 0) {
    return attachPlayers(await finalizeGame({ ...synced, clocks: { whiteMs, blackMs } }, "white", "Black flagged"), input.playerId);
  }

  const chess = new Chess(synced.fen);
  const move = chess.move({
    from: input.from,
    to: input.to,
    promotion: input.promotion as "q" | "r" | "b" | "n" | undefined
  });

  if (!move) {
    throw new Error("Illegal move");
  }

  const now = new Date().toISOString();
  const moverClockAfterIncrement =
    playerSide === "white"
      ? { whiteMs: whiteMs + synced.timeControl.incrementMs, blackMs }
      : { whiteMs, blackMs: blackMs + synced.timeControl.incrementMs };

  const isCapture = move.flags.includes("c") || move.flags.includes("e");
  const isPawnMove = move.piece === "p";
  const newHalfMoveClock = isCapture || isPawnMove ? 0 : synced.halfMoveClock + 1;

  let next: Partial<GameDocument> = {
    fen: chess.fen(),
    pgn: chess.pgn(),
    moves: [...synced.moves, move.san],
    clocks: moverClockAfterIncrement,
    activeColor: chess.turn() === "w" ? "white" : "black",
    lastMoveAt: now,
    drawOfferedBy: null,
    drawAcceptedBy: null,
    halfMoveClock: newHalfMoveClock,
    updatedAt: now
  };

  if (chess.isCheckmate()) {
    next = {
      ...next,
      status: "finished",
      result: playerSide,
      resultReason: "Checkmate",
      lastMoveAt: null
    };
  } else if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition() || chess.isInsufficientMaterial()) {
    next = {
      ...next,
      status: "finished",
      result: "draw",
      resultReason: "Draw",
      lastMoveAt: null
    };
  } else if (newHalfMoveClock >= 100) {
    next = {
      ...next,
      status: "finished",
      result: "draw",
      resultReason: "50-move rule",
      lastMoveAt: null
    };
  }

  const { data: updated, error: updateError } = await supabase
    .from("games")
    .update(next)
    .eq("code", input.code)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to submit move: ${updateError.message}`);
  }

  return attachPlayers(updated as GameDocument, input.playerId);
}

export async function offerDraw(input: { code: string; playerId: string }) {
  const { data: game, error: fetchError } = await supabase
    .from("games")
    .select("*")
    .eq("code", input.code)
    .single();

  if (fetchError || !game) {
    throw new Error("Game not found");
  }

  const synced = await syncTimeoutIfNeeded(game as GameDocument);

  if (synced.status !== "live") {
    throw new Error("Game is not live");
  }

  const playerSide = synced.whitePlayerId === input.playerId ? "white" : synced.blackPlayerId === input.playerId ? "black" : null;

  if (!playerSide) {
    throw new Error("You are not part of this game");
  }

  const now = new Date().toISOString();
  
  if (synced.drawAcceptedBy) {
    const { data: updated } = await supabase
      .from("games")
      .update({
        status: "finished",
        result: "draw",
        resultReason: "Draw accepted",
        lastMoveAt: null,
        updatedAt: now
      })
      .eq("code", input.code)
      .select()
      .single();
      
    return attachPlayers(updated as GameDocument, input.playerId);
  }

  const { data: updated } = await supabase
    .from("games")
    .update({
      drawOfferedBy: playerSide,
      updatedAt: now
    })
    .eq("code", input.code)
    .select()
    .single();

  return attachPlayers(updated as GameDocument, input.playerId);
}

export async function acceptDraw(input: { code: string; playerId: string }) {
  const { data: game, error: fetchError } = await supabase
    .from("games")
    .select("*")
    .eq("code", input.code)
    .single();

  if (fetchError || !game) {
    throw new Error("Game not found");
  }

  const synced = await syncTimeoutIfNeeded(game as GameDocument);

  if (synced.status !== "live") {
    throw new Error("Game is not live");
  }

  const playerSide = synced.whitePlayerId === input.playerId ? "white" : synced.blackPlayerId === input.playerId ? "black" : null;

  if (!playerSide) {
    throw new Error("You are not part of this game");
  }

  if (synced.drawOfferedBy === playerSide || !synced.drawOfferedBy) {
    throw new Error("No draw offer to accept");
  }

  const now = new Date().toISOString();
  const { data: updated } = await supabase
    .from("games")
    .update({
      status: "finished",
      result: "draw",
      resultReason: "Draw accepted",
      lastMoveAt: null,
      drawAcceptedBy: playerSide,
      updatedAt: now
    })
    .eq("code", input.code)
    .select()
    .single();

  return attachPlayers(updated as GameDocument, input.playerId);
}

export async function resignGame(input: { code: string; playerId: string }) {
  const { data: game, error: fetchError } = await supabase
    .from("games")
    .select("*")
    .eq("code", input.code)
    .single();

  if (fetchError || !game) {
    throw new Error("Game not found");
  }

  const synced = await syncTimeoutIfNeeded(game as GameDocument);

  if (synced.status !== "live") {
    throw new Error("Game is not live");
  }

  const playerSide = synced.whitePlayerId === input.playerId ? "white" : synced.blackPlayerId === input.playerId ? "black" : null;

  if (!playerSide) {
    throw new Error("You are not part of this game");
  }

  const winner = playerSide === "white" ? "black" : "white";
  const now = new Date().toISOString();
  
  const { data: updated } = await supabase
    .from("games")
    .update({
      status: "finished",
      result: winner,
      resultReason: "Resignation",
      lastMoveAt: null,
      updatedAt: now
    })
    .eq("code", input.code)
    .select()
    .single();

  return attachPlayers(updated as GameDocument, input.playerId);
}

export async function listGamesForUser(playerId: string) {
  const { data: games } = await supabase
    .from("games")
    .select("*")
    .or(`whitePlayerId.eq.${playerId},blackPlayerId.eq.${playerId},creatorId.eq.${playerId}`)
    .order("updatedAt", { ascending: false })
    .limit(12);

  if (!games) return [];

  return Promise.all(games.map((game) => attachPlayers(game as GameDocument, playerId)));
}
