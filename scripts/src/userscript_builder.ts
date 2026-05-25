import { BuildOptions, build } from "esbuild";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { rawTsPlugin } from "./raw_ts_plugin";

const SCRIPT_VERSION = "1.22";

function loadEnv(): Record<string, string> {
  const file = existsSync(".env") ? ".env" : ".env.example";
  const entries = readFileSync(file, "utf8").split("\n").filter(line => line.includes("="));
  return Object.fromEntries(entries.map(line => line.trim().split("=")));
}

function buildDefine(): Record<string, string> {
  const env = Object.fromEntries(Object.entries(loadEnv()).map(([key, value]) => [key, JSON.stringify(value === "true")]));
  return { ...env, SCRIPT_VERSION: JSON.stringify(SCRIPT_VERSION) };
}

const OUT_FILE = "dist/favorites_search_gallery.user.js";
const USERSCRIPT_HEADER = `// ==UserScript==
// @name         Rule34 Favorites Search Gallery
// @namespace    bruh3396
// @version      ${SCRIPT_VERSION}
// @description  Search, View, and Play Rule34 Favorites (Desktop/Android/iOS)
// @author       bruh3396
// @compatible   Chrome
// @compatible   Edge
// @compatible   Firefox
// @compatible   Safari
// @compatible   Opera
// @match        https://rule34.xxx/index.php?page=favorites&s=view&id=*
// @match        https://rule34.xxx/index.php?page=post&s=list*

// ==/UserScript==`;
const BUILD_OPTIONS: BuildOptions = {
  entryPoints: ["src/app/favorites_search_gallery.ts"],
  bundle: true,
  metafile: true,
  outfile: OUT_FILE,
  format: "iife",
  target: ["esnext"],
  legalComments: "none",
  banner: {
    js: USERSCRIPT_HEADER
  },
  define: buildDefine(),
  plugins: [rawTsPlugin],
  loader: {
    ".svg": "text",
    ".css": "text",
    ".html": "text"
  }
};

async function buildUserscript(): Promise<void> {
  const result = await build(BUILD_OPTIONS);
  const content = readFileSync(OUT_FILE, "utf8");
  const contentWithoutSourceComments = content.replace(/^\s*\/\/\s*(?:src|ts-raw).*\n/gm, "");
  const crlfContent = contentWithoutSourceComments.replace(/\r?\n/g, "\r\n");

  writeFileSync(OUT_FILE, crlfContent, "utf8");
  writeFileSync("dist/meta.json", JSON.stringify(result.metafile, null, 2), "utf8");
  console.log("✔ Build completed.");
}

buildUserscript();
