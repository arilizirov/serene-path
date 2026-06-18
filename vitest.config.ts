import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Resolve the "@/..." path alias the same way tsconfig does, but only for the
// "@/" prefix — so package scopes like "@prisma/..." are left untouched.
const srcDir = fileURLToPath(new URL("./src/", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [{ find: /^@\//, replacement: srcDir }],
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
