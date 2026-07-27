import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/neu-toast";
import { ThemeProvider } from "@/lib/ThemeProvider";
import { SidebarProvider } from "@/lib/SidebarContext";
import QueryProvider from "@/components/providers/QueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-[var(--neu-bg)] text-[var(--neu-text)] transition-colors duration-300">
        <QueryProvider>
          <ThemeProvider>
            <SidebarProvider>
              <ToastProvider>{children}</ToastProvider>
            </SidebarProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
