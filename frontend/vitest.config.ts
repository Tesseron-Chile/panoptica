import { defineConfig, type Plugin } from "vitest/config";
import path from "path";

const cssMock: Plugin = {
  name: "css-mock",
  transform(_code, id) {
    if (id.endsWith(".css")) {
      return { code: "export default {}", map: null };
    }
  },
};

export default defineConfig({
  plugins: [cssMock],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "happy-dom",
    setupFiles: ["./vitest.setup.ts"],
  },
});
