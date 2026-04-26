import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Chess Heaven",
  description: "Minimal competitive online chess with elegant customization."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
