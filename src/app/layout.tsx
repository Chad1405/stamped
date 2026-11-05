import type { Metadata, Viewport } from "next";
import { Chivo_Mono } from "next/font/google";
import "./globals.css";

const chivo = Chivo_Mono({ subsets: ["latin"], weight: ["400", "500", "800"], variable: "--font-chivo", display: "swap" });

export const metadata: Metadata = {
  title: "Stamped",
  description: "A daily travel game: five photo clues. Name the country, then risk it for the city and the exact spot.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={chivo.variable}>
      <body>{children}</body>
    </html>
  );
}
