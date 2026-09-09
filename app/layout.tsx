import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/neu-toast";
import { VisualNoticeProvider } from "@/components/ui/visual-notice-modal";
import { ThemeProvider } from "@/lib/ThemeProvider";
import { SidebarProvider } from "@/lib/SidebarContext";
import QueryProvider from "@/components/providers/QueryProvider";
import { SupportImpersonationBanner } from "@/components/layout/support-impersonation-banner";

// Les polices Geist sont chargées via CSS (public/fonts.css) pour éviter
// la dépendance réseau de next/font/google au moment du build.
// Les variables CSS --font-geist-sans et --font-geist-mono restent compatibles
// avec tous les composants existants.

export const metadata: Metadata = {
  title: "progitpaie — Employee Attendance System",
  description:
    "Role-based employee attendance tracking system with check-in/check-out, admin dashboard, and detailed reports.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className="h-full antialiased"
      style={
        {
          "--font-geist-sans":
            "Geist, Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
          "--font-geist-mono":
            "Geist Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        } as React.CSSProperties
      }
    >
      <head>
        {/* Chargement Geist depuis CDN jsDelivr — ne bloque pas le build */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-[var(--neu-bg)] text-[var(--neu-text)] transition-colors duration-300"
        style={{ fontFamily: "var(--font-geist-sans)" }}
      >
        <QueryProvider>
          <ThemeProvider>
            <SidebarProvider>
              <VisualNoticeProvider>
                <ToastProvider>
                  <SupportImpersonationBanner />
                  {children}
                </ToastProvider>
              </VisualNoticeProvider>
            </SidebarProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

