import * as esbuild from "esbuild";
import * as path from "path";

// Mirrors Vite's `?inline`: the import is the stylesheet with its @imports bundled, as a string.
export const inlineCssPlugin: esbuild.Plugin = {
  name: "inline-css-plugin",
  setup(build: esbuild.PluginBuild): void {
    build.onResolve({ filter: /\.css\?inline$/ }, resolveInlineImport);
    build.onLoad({ filter: /\.css$/, namespace: "css-inline" }, loadBundledCss);
  }
};

function resolveInlineImport(args: esbuild.OnResolveArgs): esbuild.OnResolveResult {
  return { path: resolveSpecifier(args.path.replace(/\?inline$/, ""), args.resolveDir), namespace: "css-inline" };
}

function resolveSpecifier(specifier: string, resolveDir: string): string {
  if (specifier.startsWith("@/")) {
    return path.resolve("src", specifier.slice("@/".length));
  }
  return path.resolve(resolveDir, specifier);
}

async function loadBundledCss(args: esbuild.OnLoadArgs): Promise<esbuild.OnLoadResult> {
  const result = await esbuild.build({ entryPoints: [args.path], bundle: true, write: false, minify: true, metafile: true });
  return { contents: result.outputFiles[0].text, loader: "text", watchFiles: Object.keys(result.metafile?.inputs ?? {}) };
}
