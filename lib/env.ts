import { z } from "zod";

const schema = z.object({
  MONGODB_URI: z.string().min(1),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  APP_MODE: z.enum(["local", "deploy"]).default("local"),
  NEXT_PUBLIC_LOCAL_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_DEPLOY_FRONTEND_URL: z.string().url().optional(),
  NEXT_PUBLIC_DEPLOY_BACKEND_URL: z.string().url().optional(),
});

const raw = {
  MONGODB_URI: process.env.MONGODB_URI,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  APP_MODE: process.env.APP_MODE,
  NEXT_PUBLIC_LOCAL_URL: process.env.NEXT_PUBLIC_LOCAL_URL,
  NEXT_PUBLIC_DEPLOY_FRONTEND_URL: process.env.NEXT_PUBLIC_DEPLOY_FRONTEND_URL,
  NEXT_PUBLIC_DEPLOY_BACKEND_URL: process.env.NEXT_PUBLIC_DEPLOY_BACKEND_URL,
};

const parsed = schema.parse(raw);

const isLocal = parsed.APP_MODE === "local";

const siteUrl = isLocal 
  ? parsed.NEXT_PUBLIC_LOCAL_URL 
  : (parsed.NEXT_PUBLIC_DEPLOY_FRONTEND_URL || parsed.NEXT_PUBLIC_LOCAL_URL);

const apiUrl = isLocal 
  ? parsed.NEXT_PUBLIC_LOCAL_URL 
  : (parsed.NEXT_PUBLIC_DEPLOY_BACKEND_URL || siteUrl);

export const env = {
  ...parsed,
  NEXT_PUBLIC_SITE_URL: siteUrl,
  NEXT_PUBLIC_API_URL: apiUrl,
  NEXT_PUBLIC_APP_URL: siteUrl, // Keep for backward compatibility if any
};
