import { BUILD_OPTIONS, DEMO_BUILD_OPTIONS, DEMO_HTML_FILE, DEMO_OUT_HTML_FILE, META_FILE, OUT_FILE } from "./config";
import { copyFileSync, readFileSync, writeFileSync } from "fs";
import { build } from "esbuild";
import { filterMetafile } from "./metafile_filter";
import { postProcess } from "./post_process";

const TARGETS: Record<string, () => Promise<void>> = {
  userscript: buildUserscript,
  demo: buildDemo
};

async function buildUserscript(): Promise<void> {
  const result = await build(BUILD_OPTIONS);
  const content = readFileSync(OUT_FILE, "utf8");

  writeFileSync(OUT_FILE, postProcess(content), "utf8");
  writeFileSync(META_FILE, JSON.stringify(filterMetafile(result.metafile!), null, 2), "utf8");
}

async function buildDemo(): Promise<void> {
  await build(DEMO_BUILD_OPTIONS);
  copyFileSync(DEMO_HTML_FILE, DEMO_OUT_HTML_FILE);
}

async function buildTarget(name: string): Promise<void> {
  const target = TARGETS[name];

  if (target === undefined) {
    throw new Error(`Unknown build target: ${name}`);
  }
  await target();
  console.log(`✔ Build completed (${name}).`);
}

buildTarget(process.argv[2] ?? "userscript");
