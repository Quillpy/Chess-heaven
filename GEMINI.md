# Chess Heaven: Instructional Context

Welcome to the Chess Heaven codebase. This document provides a high-level overview of the project's architecture, technologies, and development conventions.

## Project Overview

Chess Heaven is a modern, minimal online chess platform focused on private matches with a distraction-free experience.

- **Primary Stack:** Next.js 15 (App Router), React 19, TypeScript.
- **Authentication:** Clerk for secure account management.
- **Database:** Supabase (PostgreSQL) for game state and user profiles.
- **Chess Engine:** `chess.js` for rules and validation.
- **UI:** `react-chessboard` for the board, styled with a custom high-performance "Heaven" CSS system.

## Key Directories

- `app/`: Next.js pages and API routes.
  - `api/games/`: Serverless functions for match logic and real-time streaming (SSE).
- `components/`: React components.
  - `game-room.tsx`: Core match interface with optimized re-renders and local customization.
  - `dashboard-screen.tsx`: User profile and match management.
- `lib/`: Business logic.
  - `games.ts`: Game state transitions and server-side clock synchronization.

## UI & Themes

- **Board Themes:** 9 curated board palettes (Classic, Midnight, Ocean, etc.) stored in `localStorage`.
- **App Themes:** 11 global app color schemes supported via CSS variables and `data-theme` attributes.
- **Styling:** Custom minimal CSS in `app/globals.css` designed for speed and clarity. No bulky UI libraries.

## Development Conventions

- **Type Safety:** Strict TypeScript usage. Run `npm run typecheck` before deployment.
- **Real-time Sync:** SSE polling via `/api/games/[code]/stream` (1s interval).
- **Clock Logic:** Clocks are synced to server-time during state requests to prevent drift. Timeouts are handled server-side.
- **Performance:** Memoized components in high-frequency update areas (like the game board and clocks).

## Building and Running

- `npm run dev`: Start development server.
- `npm run typecheck`: Run TypeScript compiler check (Essential for board component validation).
- `npm run lint`: Run ESLint.
- `npm run build`: Production build.
