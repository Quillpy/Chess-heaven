"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const pathname = usePathname();

  return (
    <div className="topbar">
      <Link href="/dashboard" className="brand">
        Heaven
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <nav className="nav-links">
          <Link 
            href="/dashboard" 
            className={cn(pathname === "/dashboard" && "active")}
          >
            Dashboard
          </Link>
          <Link 
            href="/settings" 
            className={cn(pathname === "/settings" && "active")}
          >
            Settings
          </Link>
        </nav>
        <UserButton afterSignOutUrl="/" />
      </div>
    </div>
  );
}
