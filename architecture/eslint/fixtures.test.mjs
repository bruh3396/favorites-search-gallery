import { describe, expect, test } from "vitest";
import { existsSync, globSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");
const FIXTURES = resolve(import.meta.dirname, "fixtures/src");
const UNBUILT = ["core/features"];

function isUnbuilt(folder) {
  return UNBUILT.some(unbuilt => folder === unbuilt || folder.startsWith(`${unbuilt}/`));
}

const FOLDERS = globSync("**/", { cwd: FIXTURES }).map(folder => folder.replaceAll("\\", "/").replace(/\/$/, "")).filter(folder => folder !== "");

describe("fixtures", () => {
  test.each(FOLDERS.filter(folder => !isUnbuilt(folder)))("%s exists in src", folder => {
    expect(existsSync(resolve(ROOT, "src", folder))).toBe(true);
  });

  test.each(UNBUILT)("%s is still unbuilt", folder => {
    expect(existsSync(resolve(ROOT, "src", folder))).toBe(false);
  });
});
