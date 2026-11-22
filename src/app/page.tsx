import type { Metadata } from "next";
import Game from "@/components/Game";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { alternates: { canonical: "/" } };

// What search engines and AI answers read about the game: its name, what it is, that it's free, and who makes it. Keep it in step with the visible pages.
const STRUCTURED = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", "@id": `${SITE.url}/#site`, name: SITE.name, alternateName: ["Born There game", "bornthere.app"], url: `${SITE.url}/`, publisher: { "@id": `${SITE.url}/#org` } },
    { "@type": "Organization", "@id": `${SITE.url}/#org`, name: SITE.operator, email: SITE.email },
    {
      "@type": "VideoGame", name: SITE.name, url: `${SITE.url}/`, description: SITE.description, image: `${SITE.url}/opengraph-image.png`,
      genre: ["Geography", "Trivia", "Puzzle"], gamePlatform: "Web browser", applicationCategory: "GameApplication", operatingSystem: "Any",
      inLanguage: "en", isAccessibleForFree: true, publisher: { "@id": `${SITE.url}/#org` },
      offers: [
        { "@type": "Offer", name: "Daily flight", price: "0", priceCurrency: "GBP" },
        { "@type": "Offer", name: "Archive pass", price: SITE.passPrice.replace(/[^\d.]/g, ""), priceCurrency: "GBP" },
      ],
    },
  ],
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED).replace(/</g, "\\u003c") }} />
      <Game />
    </>
  );
}
