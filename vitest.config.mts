import { configDefaults, defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";
import { UNTESTED_ROOTS } from "./untested_roots.mjs";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(dirname, "src")
    }
  },
  test: {
    exclude: [...configDefaults.exclude],
    isolate: false,
    pool: "threads",
    minWorkers: 4,
    maxWorkers: 4,
    fsModuleCache: true,
    coverage: {
      provider: "v8",
      reporter: [["text", { skipFull: true }], "html"],
      watermarks: {
        statements: [80, 100],
        branches: [80, 100],
        functions: [80, 100],
        lines: [80, 100]
      },
      all: true,
      include: ["src/**/*.ts"],
      exclude: [...(configDefaults.coverage?.exclude ?? []), ...UNTESTED_ROOTS, "src/playground/**", "src/**/testing/**", "build/**", "src/**/*.test.ts", "src/**/*.d.ts"]
    }
  }
});
