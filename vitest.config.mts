import { configDefaults, defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(dirname, "src")
    }
  },
  define: {
    USE_LOCAL_SERVER: "false",
    SCRIPT_VERSION: JSON.stringify("test")
  },
  test: {
    exclude: [...configDefaults.exclude, ".audit/**", "src/playground/**"],
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
      exclude: [...(configDefaults.coverage?.exclude ?? []), "src/playground/**", "src/**/testing/**", "build/**", "src/**/*.test.ts", "src/**/*.d.ts"]
    }
  }
});
