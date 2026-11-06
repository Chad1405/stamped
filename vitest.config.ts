import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  // starting the in-memory Postgres and running migrations can pass 10s on a busy machine, so setup gets the same headroom as tests
  test: { include: ["src/**/*.test.ts"], testTimeout: 20000, hookTimeout: 30000 },
});
