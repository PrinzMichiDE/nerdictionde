import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    projects: [
      {
        extends: true,
        test: {
          environment: "jsdom",
          include: ["tests/hooks/**/*.test.ts", "tests/hooks/**/*.test.tsx"],
          setupFiles: [],
        },
      },
    ],
  },
});
