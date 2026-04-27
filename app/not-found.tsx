import Link from "next/link";
import { AppHeader } from "@/components/app-header";

export default function NotFound() {
  return (
    <main className="shell">
      <AppHeader />
      <div className="hero" style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", marginTop: 120 }}>
        <p className="eyebrow accent-color">Error 404</p>
        <h1 className="hero-title">
          Board <span>not found.</span>
        </h1>
        <p className="hero-description" style={{ margin: "20px auto" }}>
          This game room does not exist or has been closed. You may want to check the code and try again.
        </p>
        <div className="hero-actions">
          <Link href="/dashboard" className="btn btn-primary btn-lg">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
