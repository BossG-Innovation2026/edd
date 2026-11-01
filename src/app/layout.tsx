import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Navigation } from "./Navigation";
import "./globals.css";

export const metadata: Metadata = {
  title: "School Safety Reporting",
  description: "Risk Profiling and Safety Analytics System",
};

// FR-UX-10: designed for small phone screens first.
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    // NFR-IC-03: interface language is English only.
    <html lang="en">
      <body>
        {session?.user && <Navigation />}
        <main>{children}</main>
      </body>
    </html>
  );
}
