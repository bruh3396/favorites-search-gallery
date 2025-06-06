import esbuild from "esbuild";
import fs from "fs/promises";
import path from "path";

export const webWorker = {
  name: "ts-raw-loader",
  setup(build) {
    build.onResolve({ filter: /\?raw$/ }, args => {
      let rawPath = args.path.replace(/\?raw$/, "");

      if (!rawPath.endsWith(".ts")) {
        rawPath += ".ts";
      }
      const fullPath = path.resolve(args.resolveDir, rawPath);
      return { path: fullPath, namespace: "ts-raw" };
    });

    build.onLoad({ filter: /\.ts$/, namespace: "ts-raw" }, async args => {
      const result = await esbuild.transform(
        await fs.readFile(args.path, "utf8"),
        {
          loader: "ts",
          format: "iife",
          target: "esnext",
          sourcemap: false
        }
      );
      return {
        contents: result.code,
        loader: "text"
      };
    });
  }
};
