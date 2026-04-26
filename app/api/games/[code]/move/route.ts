import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAppUser } from "@/lib/auth";
import { submitMove } from "@/lib/games";

const moveSchema = z.object({
  from: z.string().length(2),
  to: z.string().length(2),
  promotion: z.string().optional()
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const user = await requireAppUser();
    const { code } = await params;
    const payload = moveSchema.parse(await request.json());
    const game = await submitMove({
      code,
      playerId: user.clerkId,
      ...payload
    });
    return NextResponse.json({ game });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit move";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
