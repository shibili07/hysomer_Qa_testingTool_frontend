import type { Metadata } from "next";
import { AppToaster } from "@/components/ui/toaster";
import { SidebarLayout } from "@/components/sidebar-layout";
import { AuthWrapper } from "@/components/auth-wrapper";
import { AuthProvider } from "@/context/auth-context";
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
        <AuthProvider>
          <AuthWrapper>
            <SidebarLayout>
              <main className="mx-auto max-w-6xl w-full p-4 md:p-6">{children}</main>
              <AppToaster />
            </SidebarLayout>
          </AuthWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}


