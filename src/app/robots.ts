import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// Every crawler, search and AI alike, may read the public pages; the approval page and the API are not for them.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] }, sitemap: `${SITE.url}/sitemap.xml`, host: SITE.url };
}
