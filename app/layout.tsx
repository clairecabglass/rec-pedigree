import type { Metadata } from "next";
import { Playfair_Display, Lato } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import Nav from "@/components/Nav";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Redfield Equestrian Centre",
  description: "Horse registry, pedigrees and horses for sale — Redfield Equestrian Centre",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${playfair.variable} ${lato.variable} h-full`}>
      <body className="min-h-full flex flex-col" style={{ background: "var(--cream)", color: "var(--text)", fontFamily: "var(--font-lato), Georgia, serif" }}>
        <Nav />
        <main className="flex-1">
          {children}
        </main>
        <footer style={{ borderTop: "1px solid var(--border)", background: "var(--cream-dark)" }} className="py-8 text-center text-sm">
          {/* The footer logo is a discreet admin entry point */}
          <Link href="/admin" aria-label="Admin" title="Admin">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-icon.png" alt="Redfield Equestrian Centre" width={56} height={56}
              style={{ width: 56, height: 56, objectFit: "contain", margin: "0 auto 8px", opacity: 0.9, cursor: "pointer" }} />
          </Link>
          <p style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "var(--teal-dark)", fontSize: 15, letterSpacing: "0.06em", marginBottom: 4 }}>
            REDFIELD EQUESTRIAN CENTRE
          </p>
          <p style={{ color: "var(--text-muted)" }}>
            © Redfield Equestrian Centre &mdash; The Rift, ReDM
          </p>
        </footer>
      </body>
    </html>
  );
}
