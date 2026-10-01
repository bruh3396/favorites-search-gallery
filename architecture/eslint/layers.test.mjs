import { describe, expect, test } from "vitest";
import { globSync } from "node:fs";
import { resolve } from "node:path";
import { LAYERS } from "#architecture/eslint/layers.mjs";

const ROOT = resolve(import.meta.dirname, "../..");

function filesOf(layer) {
  return layer.pattern.flatMap(pattern => globSync(`${pattern}/**/*.ts`, { cwd: ROOT }));
}

describe("LAYERS", () => {
  test.each(LAYERS.map(layer => [layer.type, layer]))("%s matches a file in the repo", (_type, layer) => {
    expect(filesOf(layer)).not.toHaveLength(0);
  });
});
