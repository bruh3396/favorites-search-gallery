/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable func-names */
/* eslint-disable no-console */
import { readFileSync, writeFileSync } from "fs";
import { build } from "esbuild";
import { webWorker } from "./WEB_worker_plugin.mjs";

(async function() {
  const ENTRY_POINT = "src/app/favorites_search_gallery.ts";
  const OUT_FILE = "dist/favorites_search_gallery.user.js";
  const META_FILE = "dist/meta.json";
  const BANNER = `// ==UserScript==
// @name         Rule34 Favorites Search Gallery
// @namespace    bruh3396
// @version      1.19
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
  const LOADER = {
    ".svg": "text"
  };
  const BUILD_OPTIONS = {
    entryPoints: [ENTRY_POINT],
    bundle: true,
    metafile: true,
    outfile: OUT_FILE,
    format: "iife",
    target: ["esnext"],
    legalComments: "none",
    banner: {
      js: BANNER
    },
    plugins: [webWorker],
    loader: LOADER
  };
  const result = await build(BUILD_OPTIONS);
  const content = readFileSync(OUT_FILE, "utf8");
  const contentWithoutSourceComments = content.replace(/^\s*\/\/\s*src.*\n/gm, "");
  const crlfContent = contentWithoutSourceComments.replace(/\r?\n/g, "\r\n");

  writeFileSync(OUT_FILE, crlfContent, "utf8");
  writeFileSync(META_FILE, JSON.stringify(result.metafile, null, 2), "utf8");
  console.log("✔ Build completed.");
}());
