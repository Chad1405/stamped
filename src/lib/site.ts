/** Who runs the game and how to reach them, for the privacy and terms pages. */
export const SITE = {
  name: "Born There",
  url: "https://www.bornthere.app", // the canonical address: the bare domain redirects here, so search engines are told this one
  tagline: "the daily photo geography game",
  description: "A free daily geography game. Five photos from real places: guess the country, then risk it for the city and a final question. New every day, no sign-up.",
  operator: "Yumeji Labs",          // the person or business responsible for the game and its data
  email: "chad@yumejilabs.com",     // where privacy questions and requests go
  country: "England and Wales",     // whose law the terms follow (the UK has three legal systems)
  updated: "22 November 2026",
  social: { tiktok: "https://www.tiktok.com/@bornthere", instagram: "https://www.instagram.com/bornthere.app/" },   // the official accounts
  passPrice: "£4.99",               // shown on the unlock panel; keep in step with the Stripe price (STRIPE_PRICE_ID)
};
