# Chess Heaven

Chess Heaven is a modern, minimal online chess platform built with Next.js, Clerk, MongoDB, `chess.js`, and `react-chessboard`. It focuses on private code-based matches, elegant UI, fast interactions, custom time controls, time odds, and local board customization.

## Features

- Clerk authentication with account creation and login
- Automatic player provisioning with a starting Elo of `1200`
- Private room creation with invite codes
- Custom side selection: `white`, `black`, or `random`
- Custom time controls with independent white and black clocks
- Increment support
- Time odds support by setting different white and black clocks
- Legal move validation through `chess.js`
- FEN and PGN generation
- Live multiplayer flow through polling
- Game status handling for waiting, live, checkmate, draw, and flag fall
- Board theme and orientation customization stored in local storage
- Clean landing page, dashboard, and play room UX

## Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Clerk
- MongoDB native driver
- `chess.js`
- `react-chessboard`

## Environment

Create a `.env` file with:

```env
MONGODB_URI=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
```

Your repository already contains these values.

## Getting Started

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## How It Works

1. A user signs up or logs in through Clerk.
2. The app provisions a MongoDB-backed profile with a starting Elo of `1200`.
3. From the dashboard, the player creates a game with:
   - side preference
   - white clock
   - black clock
   - increment
4. The app returns a short invite code.
5. The opponent joins with that code.
6. When both players are present, the room switches from `waiting` to `live`.
7. Moves are validated with `chess.js`, persisted in MongoDB, and reflected in the UI.
8. Clocks update based on active turn timing and increment rules.
9. The board state, SAN move list, FEN, PGN, and result metadata stay synchronized across refreshes.

## Project Structure

```text
app/
  api/
  dashboard/
  play/[code]/
components/
  app-header.tsx
  dashboard-screen.tsx
  game-room.tsx
lib/
  auth.ts
  env.ts
  games.ts
  mongodb.ts
  types.ts
  users.ts
  utils.ts
middleware.ts
```

## Notes

- The current live update model uses lightweight polling for reliability and simplicity.
- Time odds are implemented by allowing different initial white and black clock values.
- Board customization is client-side and local to each player.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run typecheck
```

## Deployment

Deploy to Vercel or any Node-compatible platform that supports Next.js and environment variables. Configure Clerk keys and MongoDB before going live.
