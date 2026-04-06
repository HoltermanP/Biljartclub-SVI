import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import NavAuth from './components/NavAuth';

export const metadata: Metadata = {
  title: "Biljartclub SVI",
  description: "Carambolebiljarten - Leden, Competities en Partijen",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="nl" className="h-full">
        <body className="min-h-full flex flex-col min-w-0" style={{ backgroundColor: '#0d2b1e', color: '#f5e6c8' }}>
          <nav style={{ backgroundColor: '#1a4731', borderBottom: '1px solid rgba(201,168,76,0.3)' }} className="nav-shell">
            <div className="max-w-6xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <Link href="/" className="text-lg sm:text-xl font-bold shrink-0 min-h-[44px] inline-flex items-center" style={{ color: '#c9a84c' }}>
                <span aria-hidden>🎱</span>
                <span className="ml-1.5">Biljartclub SVI</span>
              </Link>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 sm:gap-6 sm:justify-end">
                <Link href="/members" className="min-h-[44px] inline-flex items-center py-2 hover:underline active:opacity-80" style={{ color: '#f5e6c8' }}>Leden</Link>
                <Link href="/competitions" className="min-h-[44px] inline-flex items-center py-2 hover:underline active:opacity-80" style={{ color: '#f5e6c8' }}>Competities</Link>
                <div className="min-h-[44px] flex items-center">
                  <NavAuth />
                </div>
              </div>
            </div>
          </nav>
          <main className="flex-1 max-w-6xl mx-auto w-full min-w-0 px-3 py-4 sm:px-4 sm:py-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {children}
          </main>
          <footer className="text-center py-3 sm:py-4 px-3 text-xs sm:text-sm safe-footer" style={{ color: 'rgba(245,230,200,0.5)', borderTop: '1px solid rgba(201,168,76,0.2)' }}>
            Biljartclub SVI &mdash; Carambolebiljarten
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
