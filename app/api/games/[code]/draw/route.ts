import { NextResponse } from "next/server";
import { requireAppUser } from "@/lib/auth";
import { offerDraw, acceptDraw } from "@/lib/games";

export async function POST(_: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const user = await requireAppUser();
    const { code } = await params;
    const action = await _.json();

    let game;
    if (action.action === "offer") {
      game = await offerDraw({ code, playerId: user.clerkId });
    } else if (action.action === "accept") {
      game = await acceptDraw({ code, playerId: user.clerkId });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ game });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to process draw";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}