import Link from "next/link";

export default function NotFound() {
  return (
    <main className="shell" style={{ paddingTop: 96 }}>
      <div className="glass card" style={{ maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
        <h1 className="title" style={{ fontSize: "clamp(2.5rem, 8vw, 4rem)" }}>
          Board not found
        </h1>
        <p className="subtle">This game room does not exist or is no longer available.</p>
        <div className="button-row" style={{ justifyContent: "center" }}>
          <Link href="/dashboard" className="button button-primary">
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
