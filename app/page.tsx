import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";

export default function HomePage() {
  return (
    <main className="shell" style={{ paddingBottom: 48 }}>
      <div className="topbar">
        <Link href="/" className="brand">
          Chess Heaven
        </Link>
        <div style={{ display: "flex", gap: 8 }}>
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
              Dashboard
            </Link>
          </SignedIn>
        </div>
      </div>

      <section style={{ display: "grid", gap: 24, maxWidth: 640, marginTop: 48 }}>
        <div>
          <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 3.5rem)", fontWeight: 700, lineHeight: 1.1, letterSpacing: -0.03 }}>
            Play chess.<br />
            <span style={{ color: "var(--accent)" }}>Simply.</span>
          </h1>
          <p style={{ fontSize: 16, color: "var(--text-dim)", marginTop: 16, lineHeight: 1.6, maxWidth: 480 }}>
            Minimal online chess with clean boards, code invites, and a distraction-free interface.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <SignedOut>
            <SignUpButton mode="modal">
              <button className="btn btn-primary">Start playing</button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link className="btn btn-primary" href="/dashboard">
              Create game
            </Link>
          </SignedIn>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <h2 style={{ fontSize: 16, marginBottom: 16 }}>Features</h2>
          <ul style={{ listStyle: "none", display: "grid", gap: 12 }}>
            <li style={{ color: "var(--text-dim)", fontSize: 14 }}>
              <strong style={{ color: "var(--text)" }}>Private matches</strong> — Share a code to invite anyone
            </li>
            <li style={{ color: "var(--text-dim)", fontSize: 14 }}>
              <strong style={{ color: "var(--text)" }}>Custom boards</strong> — Three clean palettes to choose from
            </li>
            <li style={{ color: "var(--text-dim)", fontSize: 14 }}>
              <strong style={{ color: "var(--text)" }}>Time odds</strong> — Set different clocks for each side
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}