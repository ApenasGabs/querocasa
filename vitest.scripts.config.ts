import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/scripts/*.test.ts"],
    environment: "node",
    globals: true,
  },
  resolve: {
    alias: {
      "@fixtures": path.resolve(__dirname, "./test-fixtures"),
    },
  },
});
