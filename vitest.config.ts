import { configDefaults, defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  },
  test: {
    exclude: [...configDefaults.exclude],
    isolate: false,
    pool: "threads",
    poolOptions: {
      threads: {
        minThreads: 4,
        maxThreads: 4
      }
    }
  }
});
