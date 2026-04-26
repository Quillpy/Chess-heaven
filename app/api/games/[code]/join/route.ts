import { NextResponse } from "next/server";
import { requireAppUser } from "@/lib/auth";
import { getGameForViewer, joinGame } from "@/lib/games";

export async function POST(_: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const user = await requireAppUser();
    const { code } = await params;
    await joinGame(code, user.clerkId);
    const game = await getGameForViewer(code, user.clerkId);
    return NextResponse.json({ game });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to join game";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
