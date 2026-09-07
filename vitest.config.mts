import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Unit tests run in plain Node (no DOM) against the pure library code in src/lib.
 * Anything that needs a request scope (next/headers) or a database is covered by
 * the Playwright suite in e2e/ instead.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**", "e2e/**"],
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
});
