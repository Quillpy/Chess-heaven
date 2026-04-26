import { getDb } from "@/lib/mongodb";
import type { AppUser } from "@/lib/types";

export async function ensureUser(input: {
  clerkId: string;
  email: string;
  username: string;
  imageUrl: string;
}) {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.collection<AppUser>("users").updateOne(
    { clerkId: input.clerkId },
    {
      $setOnInsert: {
        elo: 1200,
        createdAt: now
      },
      $set: {
        email: input.email,
        username: input.username,
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
