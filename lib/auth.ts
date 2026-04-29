import { auth, currentUser } from "@clerk/nextjs/server";
import { ensureUser } from "@/lib/users";

export async function requireAppUser() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await currentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const email = user.primaryEmailAddress?.emailAddress ?? `${userId}@chessheaven.local`;
  const username =
    user.username ?? ([user.firstName, user.lastName].filter(Boolean).join(" ") || email.split("@")[0] || "Player");
  const imageUrl = user.imageUrl;

  const appUser = await ensureUser({
    clerkId: userId,
    email,
    username,
    firstName: user.firstName ?? undefined,
    lastName: user.lastName ?? undefined,
    imageUrl
  });

  if (!appUser) {
    throw new Error("Unable to provision user");
  }

  return {
    clerkId: appUser.clerkId,
    email: appUser.email,
    username: appUser.username,
    firstName: appUser.firstName,
    lastName: appUser.lastName,
    imageUrl: appUser.imageUrl,
    elo: appUser.elo,
    stats: appUser.stats || {
      wins: 0,
      losses: 0,
      draws: 0,
      timeSpentMs: 0
    },
    createdAt: appUser.createdAt,
    updatedAt: appUser.updatedAt
  };
}
