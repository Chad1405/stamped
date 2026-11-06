import type { Metadata, Viewport } from "next";
import "./globals.css";

// Chivo Mono is self-hosted from public/fonts (see the @font-face rules at the top of globals.css), so builds never fetch from Google Fonts.

export const metadata: Metadata = {
  title: "Stamped",
  description: "A daily travel game: five photo clues. Name the country, then risk it for the city and the exact spot.",
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
