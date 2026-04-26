import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createGame, listGamesForUser } from "@/lib/games";
import { requireAppUser } from "@/lib/auth";

const createGameSchema = z.object({
  creatorSide: z.enum(["white", "black", "random"]),
  whiteMinutes: z.number().min(1).max(180),
  blackMinutes: z.number().min(1).max(180),
  incrementSeconds: z.number().min(0).max(180)
});

export async function GET() {
  try {
    const user = await requireAppUser();
    const games = await listGamesForUser(user.clerkId);
    return NextResponse.json({ games });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAppUser();
    const payload = createGameSchema.parse(await request.json());
    const game = await createGame({
      creatorId: user.clerkId,
      ...payload
    });
    return NextResponse.json({ code: game.code });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create game";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
