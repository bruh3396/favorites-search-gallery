import * as esbuild from "esbuild";
import * as path from "path";
import { promises as fs } from "fs";

export const rawTsPlugin: esbuild.Plugin = {
  name: "ts-raw-plugin",
  setup(build: esbuild.PluginBuild): void {
    build.onResolve({ filter: /\?raw$/ }, resolveRawImport);
    build.onLoad({ filter: /\.ts$/, namespace: "ts-raw" }, loadTsIifeString);
  }
};

function resolveRawImport(args: esbuild.OnResolveArgs): esbuild.OnResolveResult {
  return { path: resolveRawPath(args), namespace: "ts-raw" };
}

function resolveRawPath(args: esbuild.OnResolveArgs): string {
  const rawPath = args.path.replace(/\?raw$/, "");
  const withExtension = rawPath.endsWith(".ts") ? rawPath : `${rawPath}.ts`;
  return path.resolve(args.resolveDir, withExtension);
}

function loadTsIifeString(args: esbuild.OnLoadArgs): Promise<esbuild.OnLoadResult> {
  return fs.readFile(args.path, "utf8")
    .then(content => compileTsIife(content))
    .then(result => ({ contents: result.code, loader: "text" }));
}

function compileTsIife(content: string): Promise<esbuild.TransformResult> {
  return esbuild.transform(content, { loader: "ts", format: "iife", target: "esnext", sourcemap: false });
}
