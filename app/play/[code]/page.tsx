import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { GameRoom } from "@/components/game-room";
import { requireAppUser } from "@/lib/auth";
import { getGameForViewer } from "@/lib/games";

export default async function PlayPage({ params }: { params: Promise<{ code: string }> }) {
  const user = await requireAppUser();
  const { code } = await params;
  const game = await getGameForViewer(code, user.clerkId);

  if (!game) {
    notFound();
  }

  return (
    <main className="shell" style={{ paddingBottom: 48 }}>
      <AppHeader />
      <GameRoom initialGame={game} />
    </main>
  );
}
