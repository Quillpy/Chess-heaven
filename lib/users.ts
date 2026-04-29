import { getDb } from "@/lib/mongodb";
import type { AppUser } from "@/lib/types";

export async function ensureUser(input: {
  clerkId: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  imageUrl: string;
}) {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.collection<AppUser>("users").updateOne(
    { clerkId: input.clerkId },
    {
      $setOnInsert: {
        elo: 1200,
        stats: {
          wins: 0,
          losses: 0,
          draws: 0,
          timeSpentMs: 0
        },
        createdAt: now
      },
      $set: {
        email: input.email,
        username: input.username,
        firstName: input.firstName,
        lastName: input.lastName,
        imageUrl: input.imageUrl,
        updatedAt: now
      }
    },
    { upsert: true }
  );
  return db.collection<AppUser>("users").findOne({ clerkId: input.clerkId });
}

export async function getUserByClerkId(clerkId: string) {
  const db = await getDb();
  return db.collection<AppUser>("users").findOne({ clerkId });
}
