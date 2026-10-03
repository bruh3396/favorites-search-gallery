import { defineConfig } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: dirname,
  resolve: {
    alias: {
      "@": path.resolve(dirname, "../..")
    }
  },
  build: {
    outDir: path.resolve(dirname, "../../../dist/kit"),
    emptyOutDir: true
  }
});
