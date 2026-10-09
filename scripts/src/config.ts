import { BuildOptions } from "esbuild";
import { buildDefine } from "./define";
import { buildHeader } from "./header";
import { inlineCssPlugin } from "./inline_css_plugin";
import { readFileSync } from "fs";
import { resolve } from "path";
import { resolveScriptVersion } from "./version";

export interface Bundle {
  entry: string;
  outfile: string;
  platform?: "browser" | "node";
  external?: string[];
}

export interface Target {
  userscript?: boolean;
  version?: string;
  html?: string;
  defaults?: Record<string, string>;
  bundles: Bundle[];
}

const TARGETS_FILE = "scripts/targets.json";
const BROWSER_BUILD_OPTIONS: BuildOptions = {
  bundle: true,
  format: "iife",
  target: ["esnext"],
  legalComments: "none",
  alias: {
    "@": resolve("src")
  },
  plugins: [inlineCssPlugin],
  loader: {
    ".svg": "text",
    ".css": "text",
    ".html": "text"
  }
};
const NODE_BUILD_OPTIONS: BuildOptions = {
  bundle: true,
  platform: "node",
  format: "cjs",
  target: ["node22"]
};

export function readTargets(): Record<string, Target> {
  return JSON.parse(readFileSync(TARGETS_FILE, "utf8"));
}

export function createBuildOptions(target: Target, bundle: Bundle): BuildOptions {
  const common = { entryPoints: [bundle.entry], outfile: bundle.outfile, external: bundle.external };

  if (bundle.platform === "node") {
    return { ...NODE_BUILD_OPTIONS, ...common };
  }
  const version = target.version ?? resolveScriptVersion();
  return {
    ...BROWSER_BUILD_OPTIONS,
    ...common,
    define: buildDefine(version, target.defaults ?? {}),
    ...(target.userscript === true ? { metafile: true, banner: { js: buildHeader(version) } } : {})
  };
}
