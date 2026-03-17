import type { Metadata } from "next";
import { NavLinks } from "@/components/nav-links";
import { AppToaster } from "@/components/ui/toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "POS Hysomer",
  description: "POS system with products and invoice pages"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/70 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl gap-3 px-4 py-4 text-sm font-medium">
            <NavLinks />
          </nav>
        </header>
        <main className="mx-auto max-w-6xl p-4 md:p-6">{children}</main>
        <AppToaster />
      </body>
    </html>
  );
}
