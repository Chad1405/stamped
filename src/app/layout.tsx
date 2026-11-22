import type { Metadata, Viewport } from "next";
import { Barlow_Semi_Condensed, Bungee } from "next/font/google";
import { SITE } from "@/lib/site";
import "./globals.css";

// The Departure Deck type (DESIGN.md): next/font downloads both faces at build time and serves them from this app, so players never fetch from Google.
const display = Bungee({ weight: "400", subsets: ["latin", "latin-ext", "vietnamese"], variable: "--font-bungee", display: "swap" });
const body = Barlow_Semi_Condensed({ weight: ["500", "700"], subsets: ["latin", "latin-ext", "vietnamese"], variable: "--font-barlow", display: "swap" });

// The title carries the category, not just the name: "born there" alone is an everyday phrase, so searchers add "game" or "geography".
const TITLE = `${SITE.name}: ${SITE.tagline}`;

// The share card is src/app/opengraph-image.png and the icons are icon0.svg, icon1.png and apple-icon.png beside it; Next adds their tags. Their sources are in brand/ (DESIGN.md, Brand).
// Link previews and canonical tags need absolute URLs, so they always point at the production address, even from previews and localhost.
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: TITLE,
  description: SITE.description,
  applicationName: SITE.name,
  openGraph: { title: TITLE, description: SITE.description, siteName: SITE.name, type: "website", url: "/" },
  twitter: { card: "summary_large_image", title: TITLE, description: SITE.description },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#0a2b20" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      {/* browser extensions write attributes onto <body> before React loads (e.g. style="isolation:isolate"); that is not our markup */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
