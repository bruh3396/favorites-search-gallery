import { Bundle, Target, createBuildOptions, readTargets } from "./config";
import { copyFileSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { build } from "esbuild";
import { filterMetafile } from "./metafile_filter";
import { postProcess } from "./post_process";

async function buildBundle(target: Target, bundle: Bundle): Promise<void> {
  const result = await build(createBuildOptions(target, bundle));

  if (target.userscript === true) {
    writeFileSync(bundle.outfile, postProcess(readFileSync(bundle.outfile, "utf8")), "utf8");
    writeFileSync(join(dirname(bundle.outfile), "meta.json"), JSON.stringify(filterMetafile(result.metafile!), null, 2), "utf8");
  }
}

async function buildTarget(name: string): Promise<void> {
  const target = readTargets()[name];

  if (target === undefined) {
    throw new Error(`Unknown build target: ${name}`);
  }
  await Promise.all(target.bundles.map(bundle => buildBundle(target, bundle)));

  if (target.html !== undefined) {
    copyFileSync(target.html, join(dirname(target.bundles[0].outfile), "index.html"));
  }
  console.log(`✔ Build completed (${name}).`);
}

buildTarget(process.argv[2] ?? "rule34");
