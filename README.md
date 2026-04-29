# Chess Heaven

Chess Heaven is a modern, minimal, and distraction-free online chess platform designed for private matches. Built with performance and aesthetics in mind, it offers a "zen-like" environment for competitive play without the bloat of traditional chess sites.

## 🚀 Project Overview

Chess Heaven focuses on the core chess experience. It allows players to create private rooms instantly, share a link with an opponent, and play with custom time controls and curated visual themes.

### How it Works
- **Frontend**: Next.js 15 (App Router) with React 19 and Tailwind-free custom CSS.
- **Backend**: Serverless API routes using MongoDB for persistence.
- **Real-time**: Synchronized state via Server-Sent Events (SSE) for low-latency updates.
- **Authentication**: Secure account management powered by Clerk.
- **Rules & Validation**: Move verification handled by `chess.js`.

### Key Features
- **Instant Matchmaking**: Create a room, copy the link, and you're ready.
- **Curated Themes**: Choose from 9+ board palettes and 14+ app appearance schemes.
- **Custom Time Controls**: Support for time odds (different base times for each side) and increments.
- **Responsive Design**: Play seamlessly on desktop or mobile browsers.
- **Live Replay**: A dashboard feature showcasing immortal games to sharpen your skills.

## 🛠 Running Locally

### Prerequisites
- Node.js 20+ and npm
- A MongoDB instance (local or Atlas)
- A Clerk account for authentication

### Setup
1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/chess-heaven.git
   cd chess-heaven
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory:
   ```env
   # Clerk
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_pub_key
   CLERK_SECRET_KEY=your_secret_key
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/

   # Database
   MONGODB_URI=your_mongodb_connection_string
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🌐 Deployment Guide

### Frontend: Vercel
1. Push your code to a GitHub repository.
2. Import the project into [Vercel](https://vercel.com).
3. Add all environment variables from your `.env.local` to the Vercel project settings.
4. Deploy.

### Backend/Database: Railway
1. Sign in to [Railway](https://railway.app).
2. Create a new "Provision MongoDB" service.
3. Copy the **Mongo Connection String** and use it as your `MONGODB_URI` in Vercel.
4. (Optional) If you want to host the Next.js app on Railway instead, connect your GitHub repo and Railway will automatically detect the Next.js setup.

## 🤝 Contributing

We welcome contributions from everyone! To contribute:
1. Fork the repository.
2. Create a new branch for your feature or bugfix.
3. Commit your changes with clear, descriptive messages.
4. Push to your fork and submit a **Pull Request**.

Any PR, no matter how small, is greatly appreciated!

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
