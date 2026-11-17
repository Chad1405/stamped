import type { Metadata, Viewport } from "next";
import { Barlow_Semi_Condensed, Bungee } from "next/font/google";
import "./globals.css";

// The Departure Deck type (DESIGN.md): next/font downloads both faces at build time and serves them from this app, so players never fetch from Google.
const display = Bungee({ weight: "400", subsets: ["latin", "latin-ext", "vietnamese"], variable: "--font-bungee", display: "swap" });
const body = Barlow_Semi_Condensed({ weight: ["500", "700"], subsets: ["latin", "latin-ext", "vietnamese"], variable: "--font-barlow", display: "swap" });

const DESCRIPTION = "A daily travel game: five photo clues. Name the country, then risk it for the city and a final question.";
// Link previews (iMessage, WhatsApp, Slack) need absolute image URLs. Vercel sets the production domain; locally it is localhost.
const SITE = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000";

// The share card is src/app/opengraph-image.png and the icons are icon0.svg, icon1.png and apple-icon.png beside it; Next adds their tags. Their sources are in brand/ (DESIGN.md, Brand).
export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "Born There",
  description: DESCRIPTION,
  openGraph: { title: "Born There: five stops a day", description: DESCRIPTION, siteName: "Born There", type: "website", url: "/" },
  twitter: { card: "summary_large_image", title: "Born There: five stops a day", description: DESCRIPTION },
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
