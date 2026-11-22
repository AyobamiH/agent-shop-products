import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
const base = fileURLToPath(new URL(".", import.meta.url));
export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\//, replacement: base + "src/" },
      { find: /^@catalog\//, replacement: base + "catalog/" },
    ],
  },
  test: { environment: "node", include: ["src/**/*.test.ts", "src/**/*.test.tsx"], watch: false },
});
