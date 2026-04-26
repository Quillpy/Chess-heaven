import { AppHeader } from "@/components/app-header";
import { DashboardScreen } from "@/components/dashboard-screen";
import { requireAppUser } from "@/lib/auth";
import { listGamesForUser } from "@/lib/games";

export default async function DashboardPage() {
  const user = await requireAppUser();
  const games = await listGamesForUser(user.clerkId);

  return (
    <main className="shell" style={{ paddingBottom: 48 }}>
      <AppHeader />
      <DashboardScreen user={user} games={games} />
    </main>
  );
}
