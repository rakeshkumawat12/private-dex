import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/next";
import { DemoBanner } from "@/components/DemoBanner";

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
  variable: "--font-mono",
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "VΛULT - Private DEX",
  description: "Permissioned liquidity. Zero trust. Maximum sovereignty.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${plexMono.variable} ${plexSans.variable} font-mono`} suppressHydrationWarning>
        <Providers>
          <div className="relative flex min-h-screen flex-col overflow-hidden">
            <div className="pointer-events-none fixed inset-0 z-50 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay" />
            <div className="scanlines pointer-events-none fixed inset-0 z-40" />
            <DemoBanner />
            <Navbar />
            <main className="relative z-10 flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
