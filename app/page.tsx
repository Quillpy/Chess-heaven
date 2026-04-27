import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";

export default function HomePage() {
  return (
    <main className="shell landing-page">
      <div className="topbar">
        <Link href="/" className="brand">
          Heaven
        </Link>
        <div className="nav-actions">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="btn btn-secondary">Log in</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="btn btn-primary">Sign up</button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link className="btn btn-primary" href="/dashboard">
              Go to Dashboard
            </Link>
          </SignedIn>
        </div>
      </div>

      <div className="hero">
        <div className="hero-content">
          <p className="eyebrow accent-color">Competitive Chess</p>
          <h1 className="hero-title">
            The purest way to <br />
            <span>play chess online.</span>
          </h1>
          <p className="hero-description">
            A minimal, distraction-free platform for private matches. No bloat. Just the game.
          </p>
          <div className="hero-actions">
            <SignedOut>
              <SignUpButton mode="modal">
                <button className="btn btn-primary btn-lg">Get Started</button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link className="btn btn-primary btn-lg" href="/dashboard">
                Create a Match
              </Link>
            </SignedIn>
          </div>
        </div>

        <div className="card feature-card">
          <h2 className="eyebrow" style={{ marginBottom: 20 }}>Key Features</h2>
          <div className="feature-grid">
             <div className="feature-item">
                <strong>Instant Rooms</strong>
                <span>Create a match and share the link instantly.</span>
             </div>
             <div className="feature-item">
                <strong>Time Odds</strong>
                <span>Balance matches with custom clocks for each side.</span>
             </div>
             <div className="feature-item">
                <strong>Themes</strong>
                <span>Personalize your board with curated palettes.</span>
             </div>
          </div>
        </div>
      </div>
    </main>
  );
}
