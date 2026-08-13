import { BUILD_OPTIONS, META_FILE, OUT_FILE } from "./config";
import { readFileSync, writeFileSync } from "fs";
import { build } from "esbuild";
import { filterMetafile } from "./metafile_filter";
import { postProcess } from "./post_process";

async function buildUserscript(): Promise<void> {
  const result = await build(BUILD_OPTIONS);
  const content = readFileSync(OUT_FILE, "utf8");

  writeFileSync(OUT_FILE, postProcess(content), "utf8");
  writeFileSync(META_FILE, JSON.stringify(filterMetafile(result.metafile!), null, 2), "utf8");
  console.log("✔ Build completed.");
}

buildUserscript();
