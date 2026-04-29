import { z } from "zod";

const envSchema = z.object({
  SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required"),
  CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),
  APP_MODE: z.enum(["local", "deploy"]).default("local"),
  NEXT_PUBLIC_LOCAL_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_DEPLOY_FRONTEND_URL: z.string().url().optional().or(z.literal("")),
  NEXT_PUBLIC_DEPLOY_BACKEND_URL: z.string().url().optional().or(z.literal("")),
});

// Helper to get environment variables with fallbacks for common deployment platforms
const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_DEPLOY_FRONTEND_URL) return process.env.NEXT_PUBLIC_DEPLOY_FRONTEND_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.RAILWAY_PUBLIC_DOMAIN) return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  return process.env.NEXT_PUBLIC_LOCAL_URL || "http://localhost:3000";
};

const rawEnv = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  APP_MODE: (process.env.APP_MODE || (process.env.NODE_ENV === "production" ? "deploy" : "local")) as "local" | "deploy",
  NEXT_PUBLIC_LOCAL_URL: process.env.NEXT_PUBLIC_LOCAL_URL,
  NEXT_PUBLIC_DEPLOY_FRONTEND_URL: getBaseUrl(),
  NEXT_PUBLIC_DEPLOY_BACKEND_URL: process.env.NEXT_PUBLIC_DEPLOY_BACKEND_URL || getBaseUrl(),
};

const result = envSchema.safeParse(rawEnv);

if (!result.success) {
  console.error("❌ Invalid environment variables:", JSON.stringify(result.error.format(), null, 2));
  if (process.env.NODE_ENV === "production") {
     console.warn("⚠️ Continuing in production despite invalid environment variables. This may cause runtime errors.");
  } else {
     throw new Error("Invalid environment variables");
  }
}

const parsed = result.success ? result.data : (rawEnv as any);

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
  NEXT_PUBLIC_APP_URL: siteUrl,
};
