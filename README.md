# Chess Heaven

A modern, minimal online chess platform focused on private matches with a distraction-free experience.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Auth**: Clerk
- **Database**: Supabase (PostgreSQL)
- **Chess Logic**: chess.js
- **UI**: react-chessboard + Custom CSS

## Deployment Guide

### 1. Database Setup (Supabase)

1. Create a new project on [Supabase](https://supabase.com/).
2. Go to the **SQL Editor** and run the following to create your tables:

```sql
create table users (
  "clerkId" text primary key,
  "email" text not null,
  "username" text not null,
  "firstName" text,
  "lastName" text,
  "imageUrl" text,
  "elo" int default 1200,
  "stats" jsonb default '{"wins": 0, "losses": 0, "draws": 0, "timeSpentMs": 0}'::jsonb,
  "createdAt" timestamptz default now(),
  "updatedAt" timestamptz default now()
);

create table games (
  "code" text primary key,
  "status" text not null,
  "result" text,
  "resultReason" text,
  "fen" text not null,
  "pgn" text default '',
  "moves" text[] default '{}',
  "creatorId" text not null,
  "whitePlayerId" text,
  "blackPlayerId" text,
  "timeControl" jsonb not null,
  "clocks" jsonb not null,
  "activeColor" text not null,
  "lastMoveAt" timestamptz,
  "drawOfferedBy" text,
  "drawAcceptedBy" text,
  "halfMoveClock" int default 0,
  "createdAt" timestamptz default now(),
  "updatedAt" timestamptz default now()
);
```

### 2. Authentication Setup (Clerk)

1. Create a new application on [Clerk](https://clerk.com/).
2. Copy your **Publishable Key** and **Secret Key**.

### 3. Deploy to Vercel (Recommended)

1. Push your code to a GitHub repository.
2. Import the project into [Vercel](https://vercel.com/).
3. Add the following Environment Variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `APP_MODE`: `deploy`
4. Deploy!

### 4. Deploy to Railway

1. Create a new project on [Railway](https://railway.app/).
2. Connect your GitHub repository.
3. Add the same Environment Variables as above.
4. Railway will automatically detect the Next.js project and deploy it.

## Local Development

1. Clone the repo.
2. Copy `.env.example` to `.env` and fill in your keys.
3. Run `npm install`.
4. Run `npm run dev`.
