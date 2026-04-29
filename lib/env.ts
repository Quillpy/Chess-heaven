import { z } from "zod";

const schema = z.object({
  MONGODB_URI: z.string().min(1),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional().default("http://localhost:3000"),
  NEXT_PUBLIC_API_URL: z.string().url().optional().default("http://localhost:3000"),
});

const parsed = schema.parse({
  MONGODB_URI: process.env.MONGODB_URI,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || process.env.DEPLOYMENT_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || process.env.DEPLOYMENT_URL,
});

export const env = {
  ...parsed,
  NEXT_PUBLIC_APP_URL: parsed.NEXT_PUBLIC_SITE_URL,
};
