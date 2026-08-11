import { BuildOptions } from "esbuild";
import { buildDefine } from "./define";
import { buildHeader } from "./header";
import { minifyVendorPlugin } from "./minify_vendor_plugin";
import { rawTsPlugin } from "./raw_ts_plugin";
import { resolve } from "path";
import { resolveScriptVersion } from "./version";

const SCRIPT_VERSION = resolveScriptVersion();

export const OUT_FILE = "dist/favorites_search_gallery.user.js";
export const META_FILE = "dist/meta.json";
export const BUILD_OPTIONS: BuildOptions = {
  entryPoints: ["src/app/favorites_search_gallery.ts"],
  bundle: true,
  metafile: true,
  outfile: OUT_FILE,
  format: "iife",
  target: ["esnext"],
  legalComments: "none",
  alias: {
    "@": resolve("src")
  },
  banner: {
    js: buildHeader(SCRIPT_VERSION)
  },
  define: buildDefine(SCRIPT_VERSION),
  plugins: [rawTsPlugin, minifyVendorPlugin],
  loader: {
    ".svg": "text",
    ".css": "text",
    ".html": "text"
  }
};
