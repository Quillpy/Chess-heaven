import { NextResponse } from "next/server";
import { requireAppUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireAppUser();
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
