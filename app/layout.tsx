import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import NavAuth from './components/NavAuth';

export const metadata: Metadata = {
  title: "Biljartclub SVI",
  description: "Carambolebiljarten - Leden, Competities en Partijen",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="nl" className="h-full">
        <body className="min-h-full flex flex-col" style={{ backgroundColor: '#0d2b1e', color: '#f5e6c8' }}>
          <nav style={{ backgroundColor: '#1a4731', borderBottom: '1px solid rgba(201,168,76,0.3)' }} className="px-4 py-3">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <a href="/" className="text-xl font-bold" style={{ color: '#c9a84c' }}>
                🎱 Biljartclub SVI
              </a>
              <div className="flex items-center gap-6">
                <a href="/members" className="hover:underline" style={{ color: '#f5e6c8' }}>Leden</a>
                <a href="/competitions" className="hover:underline" style={{ color: '#f5e6c8' }}>Competities</a>
                <NavAuth />
              </div>
            </div>
          </nav>
          <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
            {children}
          </main>
          <footer className="text-center py-4 text-sm" style={{ color: 'rgba(245,230,200,0.5)', borderTop: '1px solid rgba(201,168,76,0.2)' }}>
            Biljartclub SVI &mdash; Carambolebiljarten
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
