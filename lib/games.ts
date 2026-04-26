import { Chess } from "chess.js";
import { getDb } from "@/lib/mongodb";
import type { AppUser, GameDocument, GameView, PublicPlayer, Side } from "@/lib/types";
import { generateGameCode } from "@/lib/utils";

const usersCollection = "users";
const gamesCollection = "games";

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

async function attachPlayers(game: GameDocument, viewerId: string): Promise<GameView> {
  const db = await getDb();
  const ids = [game.whitePlayerId, game.blackPlayerId].filter(Boolean) as string[];
  const players = await db
    .collection<AppUser>(usersCollection)
    .find({ clerkId: { $in: ids } })
    .toArray();
  const playerMap = new Map<string, PublicPlayer>(
    players.map((player) => [
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
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
    youAre,
    isYourTurn: game.status === "live" && youAre === game.activeColor
  };
}

async function finalizeGame(game: GameDocument, result: GameDocument["result"], resultReason: string) {
  const db = await getDb();
  const now = new Date().toISOString();
  const finished = {
    ...game,
    status: "finished" as const,
    result,
    resultReason,
    lastMoveAt: null,
    updatedAt: now
  };
  await db.collection<GameDocument>(gamesCollection).updateOne(
    { code: game.code },
    {
      $set: {
        status: finished.status,
        result: finished.result,
        resultReason: finished.resultReason,
        clocks: finished.clocks,
        lastMoveAt: finished.lastMoveAt,
        updatedAt: finished.updatedAt
      }
    }
  );
  return finished;
}

async function syncTimeoutIfNeeded(game: GameDocument) {
  const live = getActiveClock(game, Date.now());

  if (live.status !== "live") {
    return live;
  }

  if (live.clocks.whiteMs === 0) {
    return finalizeGame(live, "black", "White flagged");
  }

  if (live.clocks.blackMs === 0) {
    return finalizeGame(live, "white", "Black flagged");
  }

  return live;
}

export async function createGame(input: {
  creatorId: string;
  creatorSide: Side | "random";
  whiteMinutes: number;
  blackMinutes: number;
  incrementSeconds: number;
}) {
  const db = await getDb();
  const code = generateGameCode();
  const creatorColor =
    input.creatorSide === "random" ? (Math.random() > 0.5 ? "white" : "black") : input.creatorSide;
  const now = new Date().toISOString();
  const whitePlayerId = creatorColor === "white" ? input.creatorId : null;
  const blackPlayerId = creatorColor === "black" ? input.creatorId : null;
  const game: GameDocument = {
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
    createdAt: now,
    updatedAt: now
  };
  await db.collection<GameDocument>(gamesCollection).insertOne(game);
  return game;
}

export async function joinGame(code: string, playerId: string) {
  const db = await getDb();
  const existing = await db.collection<GameDocument>(gamesCollection).findOne({ code });

  if (!existing) {
    throw new Error("Game not found");
  }

  if (existing.whitePlayerId === playerId || existing.blackPlayerId === playerId) {
    return existing;
  }

  if (existing.status !== "waiting") {
    throw new Error("Game is no longer joinable");
  }

  const now = new Date().toISOString();
  const whitePlayerId = existing.whitePlayerId ?? playerId;
  const blackPlayerId = existing.blackPlayerId ?? playerId;

  const next: GameDocument = {
    ...existing,
    whitePlayerId,
    blackPlayerId,
    status: "live",
    lastMoveAt: now,
    updatedAt: now
  };

  await db.collection<GameDocument>(gamesCollection).updateOne(
    { code, status: "waiting" },
    {
      $set: {
        whitePlayerId,
        blackPlayerId,
        status: "live",
        lastMoveAt: now,
        updatedAt: now
      }
    }
  );

  return next;
}

export async function getGameForViewer(code: string, viewerId: string) {
  const db = await getDb();
  const existing = await db.collection<GameDocument>(gamesCollection).findOne({ code });

  if (!existing) {
    return null;
  }

  const synced = await syncTimeoutIfNeeded(existing);
  return attachPlayers(synced, viewerId);
}

export async function submitMove(input: {
  code: string;
  playerId: string;
  from: string;
  to: string;
  promotion?: string;
}) {
  const db = await getDb();
  const game = await db.collection<GameDocument>(gamesCollection).findOne({ code: input.code });

  if (!game) {
    throw new Error("Game not found");
  }

  const synced = await syncTimeoutIfNeeded(game);

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

  let next: GameDocument = {
    ...synced,
    fen: chess.fen(),
    pgn: chess.pgn(),
    moves: [...synced.moves, move.san],
    clocks: moverClockAfterIncrement,
    activeColor: chess.turn() === "w" ? "white" : "black",
    lastMoveAt: now,
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
  }

  await db.collection<GameDocument>(gamesCollection).updateOne(
    { code: input.code },
    {
      $set: {
        fen: next.fen,
        pgn: next.pgn,
        moves: next.moves,
        clocks: next.clocks,
        activeColor: next.activeColor,
        status: next.status,
        result: next.result,
        resultReason: next.resultReason,
        lastMoveAt: next.lastMoveAt,
        updatedAt: next.updatedAt
      }
    }
  );

  return attachPlayers(next, input.playerId);
}

export async function listGamesForUser(playerId: string) {
  const db = await getDb();
  const games = await db
    .collection<GameDocument>(gamesCollection)
    .find({
      $or: [{ whitePlayerId: playerId }, { blackPlayerId: playerId }, { creatorId: playerId }]
    })
    .sort({ updatedAt: -1 })
    .limit(12)
    .toArray();

  return Promise.all(games.map((game) => attachPlayers(game, playerId)));
}
