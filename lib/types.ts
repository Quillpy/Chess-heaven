export type Side = "white" | "black";

export type GameStatus = "waiting" | "live" | "finished";

export type GameResult = "white" | "black" | "draw" | null;

export type BoardTheme = {
  light: string;
  dark: string;
  accent: string;
};

export type AppUser = {
  clerkId: string;
  email: string;
  username: string;
  imageUrl: string;
  elo: number;
  createdAt: string;
  updatedAt: string;
};

export type PublicPlayer = {
  clerkId: string;
  username: string;
  imageUrl: string;
  elo: number;
};

export type GameDocument = {
  code: string;
  status: GameStatus;
  result: GameResult;
  resultReason: string | null;
  fen: string;
  pgn: string;
  moves: string[];
  creatorId: string;
  whitePlayerId: string | null;
  blackPlayerId: string | null;
  timeControl: {
    whiteMs: number;
    blackMs: number;
    incrementMs: number;
  };
  clocks: {
    whiteMs: number;
    blackMs: number;
  };
  activeColor: Side;
  lastMoveAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GameView = {
  code: string;
  status: GameStatus;
  result: GameResult;
  resultReason: string | null;
  fen: string;
  pgn: string;
  moves: string[];
  creatorId: string;
  whitePlayer: PublicPlayer | null;
  blackPlayer: PublicPlayer | null;
  timeControl: {
    whiteMs: number;
    blackMs: number;
    incrementMs: number;
  };
  clocks: {
    whiteMs: number;
    blackMs: number;
  };
  activeColor: Side;
  lastMoveAt: string | null;
  createdAt: string;
  updatedAt: string;
  youAre: Side | null;
  isYourTurn: boolean;
};
