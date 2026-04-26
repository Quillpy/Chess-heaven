import { NextResponse } from "next/server";
import { requireAppUser } from "@/lib/auth";
import { getGameForViewer } from "@/lib/games";

export async function GET(_: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const user = await requireAppUser();
    const { code } = await params;
    const game = await getGameForViewer(code, user.clerkId);

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    return NextResponse.json({ game });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
