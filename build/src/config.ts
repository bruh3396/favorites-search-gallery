import { BuildOptions } from "esbuild";
import { buildDefine } from "./define";
import { buildHeader } from "./header";
import { inlineCssPlugin } from "./inline_css_plugin";
import { rawTsPlugin } from "./raw_ts_plugin";
import { resolve } from "path";
import { resolveScriptVersion } from "./version";

const SCRIPT_VERSION = resolveScriptVersion();

export const OUT_FILE = "dist/userscript/favorites_search_gallery.js";
export const META_FILE = "dist/userscript/meta.json";
export const SHARED_BUILD_OPTIONS: BuildOptions = {
  bundle: true,
  format: "iife",
  target: ["esnext"],
  legalComments: "none",
  alias: {
    "@": resolve("src")
  },
  plugins: [rawTsPlugin, inlineCssPlugin],
  loader: {
    ".svg": "text",
    ".css": "text",
    ".html": "text"
  }
};
export const BUILD_OPTIONS: BuildOptions = {
  ...SHARED_BUILD_OPTIONS,
  entryPoints: ["src/targets/userscript/main.ts"],
  metafile: true,
  outfile: OUT_FILE,
  banner: {
    js: buildHeader(SCRIPT_VERSION)
  },
  define: buildDefine(SCRIPT_VERSION)
};
export const DEMO_HTML_FILE = "src/targets/demo/index.html";
export const DEMO_OUT_HTML_FILE = "dist/demo/index.html";
export const DEMO_BUILD_OPTIONS: BuildOptions = {
  ...SHARED_BUILD_OPTIONS,
  entryPoints: ["src/targets/demo/main.ts"],
  outfile: "dist/demo/demo.js",
  define: buildDefine("demo")
};
