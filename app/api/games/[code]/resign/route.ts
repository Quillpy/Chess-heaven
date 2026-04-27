import { NextResponse } from "next/server";
import { requireAppUser } from "@/lib/auth";
import { resignGame } from "@/lib/games";

export async function POST(_: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const user = await requireAppUser();
    const { code } = await params;
    const game = await resignGame({ code, playerId: user.clerkId });
    return NextResponse.json({ game });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to resign";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}