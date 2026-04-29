import { supabase } from "@/lib/supabase";
import type { AppUser } from "@/lib/types";

export async function ensureUser(input: {
  clerkId: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  imageUrl: string;
}) {
  const now = new Date().toISOString();
  
  // First, check if user exists to get their createdAt and elo/stats if we don't want to overwrite
  const { data: existingUser } = await supabase
    .from("users")
    .select("*")
    .eq("clerkId", input.clerkId)
    .single();

  const { data, error } = await supabase
    .from("users")
    .upsert({
      clerkId: input.clerkId,
      email: input.email,
      username: input.username,
      firstName: input.firstName,
      lastName: input.lastName,
      imageUrl: input.imageUrl,
      updatedAt: now,
      // If user is new, set defaults. If not, these will be ignored or kept.
      // Upsert in Supabase (Postgres) usually overwrites unless you're careful.
      // We'll provide defaults only if it's a new user.
      elo: existingUser?.elo ?? 1200,
      stats: existingUser?.stats ?? {
        wins: 0,
        losses: 0,
        draws: 0,
        timeSpentMs: 0
      },
      createdAt: existingUser?.createdAt ?? now
    }, { onConflict: 'clerkId' })
    .select()
    .single();

  if (error) {
    console.error("Error ensuring user:", error);
    return null;
  }

  return data as AppUser;
}

export async function getUserByClerkId(clerkId: string) {
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("clerkId", clerkId)
    .single();
    
  return data as AppUser | null;
}
