import type { Metadata, Viewport } from "next";
import "./globals.css";

// Chivo Mono is self-hosted from public/fonts (see the @font-face rules at the top of globals.css), so builds never fetch from Google Fonts.

const DESCRIPTION = "A daily travel game: five photo clues. Name the country, then risk it for the city and a final question.";
// Link previews (iMessage, WhatsApp, Slack) need absolute image URLs. Vercel sets the production domain; locally it is localhost.
const SITE = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000";

// The share card is src/app/opengraph-image.png and the icons are icon.png and apple-icon.png beside it; Next adds their tags.
export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "Stamped",
  description: DESCRIPTION,
  openGraph: { title: "Stamped: five stops a day", description: DESCRIPTION, siteName: "Stamped", type: "website", url: "/" },
  twitter: { card: "summary_large_image", title: "Stamped: five stops a day", description: DESCRIPTION },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/fonts/chivo-mono-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      {/* browser extensions write attributes onto <body> before React loads (e.g. style="isolation:isolate"); that is not our markup */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
