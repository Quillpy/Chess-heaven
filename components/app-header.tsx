"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export function AppHeader() {
  return (
    <div className="topbar">
      <Link href="/dashboard" className="brand">
        Chess Heaven
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/dashboard" className="btn btn-secondary" style={{ padding: "8px 14px" }}>
          Dashboard
        </Link>
        <UserButton />
      </div>
    </div>
  );
}