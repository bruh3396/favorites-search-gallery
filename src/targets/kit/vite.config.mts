import { defineConfig } from "vite";
import { fileURLToPath } from "url";
import path from "path";

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
