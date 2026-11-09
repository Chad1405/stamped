import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // the embedded dev database ships its own WASM; keep it out of the server bundle
  serverExternalPackages: ["@electric-sql/pglite"],
  // migrations run on first request, so the SQL files must ship with everything that opens the database
  outputFileTracingIncludes: { "/api/**": ["./drizzle/**"], "/admin": ["./drizzle/**"] },
};

export default nextConfig;
