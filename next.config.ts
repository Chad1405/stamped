import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // the embedded dev database ships its own WASM; keep it out of the server bundle
  serverExternalPackages: ["@electric-sql/pglite"],
  // migrations run on first request, so the SQL files must ship with the API routes
  outputFileTracingIncludes: { "/api/**": ["./drizzle/**"] },
};

export default nextConfig;
