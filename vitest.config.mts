import { configDefaults, defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const EXCLUDED_TESTS = [...configDefaults.exclude, ".audit/**", "architecture/**", "src/playground/**"];
const DOM_TESTS = [
  "src/features/*/{control,view,shell,features}/**/*.test.ts",
  "src/features/*/*.test.ts",
  "src/features/*/flows/flows.test.ts",
  "src/app/startup/features.test.ts",
  "src/app/startup/style.test.ts",
  "src/core/ui/**/*.test.ts",
  "src/adapters/browser/ports/host_page/host_page.test.ts",
  "src/adapters/browser/ports/local_keyed_values/local_keyed_values.test.ts",
  "src/adapters/rule34/client/site/client.test.ts",
  "src/adapters/rule34/client/site/favorites_page/cleanup.test.ts",
  "src/adapters/rule34/client/site/header/header.test.ts",
  "src/adapters/rule34/client/site/theme/theme.test.ts",
  "src/adapters/rule34/client/site/**/parser.test.ts",
  "src/lib/media/download.test.ts",
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
      { extends: true, test: { name: "dom", include: DOM_TESTS, environment: "happy-dom", css: { include: [/src\/core\/ui\/.+\.css/] } } }
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

