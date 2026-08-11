import * as esbuild from "esbuild";
import { promises as fs } from "fs";

export const minifyVendorPlugin: esbuild.Plugin = {
  name: "minify-vendor-plugin",
  setup(build: esbuild.PluginBuild): void {
    build.onLoad({ filter: /node_modules.*\.(?:js|mjs|cjs)$/ }, loadMinifiedVendor);
  }
};

function loadMinifiedVendor(args: esbuild.OnLoadArgs): Promise<esbuild.OnLoadResult> {
  return fs.readFile(args.path, "utf8")
    .then(content => minifyVendor(content, args.path))
    .then(result => ({ contents: result.code, loader: "js" }));
}

function minifyVendor(content: string, filePath: string): Promise<esbuild.TransformResult> {
  return esbuild.transform(content, {
    loader: "js",
    target: "esnext",
    minify: true,
    sourcefile: filePath
  });
}
