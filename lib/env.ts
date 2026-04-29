import { z } from "zod";

const schema = z.object({
  MONGODB_URI: z.string().min(1),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  APP_MODE: z.enum(["production", "deployment"]).default("production"),
  DEPLOYMENT_URL: z.string().optional().or(z.literal("")),
});

const parsed = schema.parse({
  MONGODB_URI: process.env.MONGODB_URI,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  APP_MODE: process.env.APP_MODE,
  DEPLOYMENT_URL: process.env.DEPLOYMENT_URL,
});

export const env = {
  ...parsed,
  NEXT_PUBLIC_APP_URL: parsed.APP_MODE === "production" 
    ? "http://localhost:3000" 
    : (parsed.DEPLOYMENT_URL || "http://localhost:3000")
};
