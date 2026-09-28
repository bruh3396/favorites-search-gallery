import { configDefaults, defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const EXCLUDED_TESTS = [...configDefaults.exclude, ".audit/**", "src/playground/**"];
const DOM_TESTS = [
  "src/features/*/{control,view,shell,features}/**/*.test.ts",
  "src/features/*/*.test.ts",
  "src/features/*/flows/flows.test.ts",
  "src/adapters/rule34/client/client.test.ts",
  "src/adapters/rule34/client/favorites_page/cleanup.test.ts",
  "src/adapters/rule34/client/**/parser.test.ts",
  "src/lib/ui/**/*.test.ts",
  "src/utils/browser/**/*.test.ts"
];

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
    exclude: EXCLUDED_TESTS,
    projects: [
      { extends: true, test: { name: "node", exclude: [...EXCLUDED_TESTS, ...DOM_TESTS] } },
      { extends: true, test: { name: "dom", include: DOM_TESTS, environment: "happy-dom" } }
    ],
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
