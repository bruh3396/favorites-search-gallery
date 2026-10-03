import { describe, expect, test } from "vitest";
import { globSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MESSAGES as IMPORT_MESSAGES } from "#architecture/eslint/imports/imports.mjs";
import { MESSAGES as SYNTAX_MESSAGES } from "#architecture/eslint/syntax/syntax.mjs";
import { PLUGIN } from "#architecture/eslint/typed/typed.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const RUNNERS = { runRule: Object.keys(IMPORT_MESSAGES), runSyntax: Object.keys(SYNTAX_MESSAGES), runTyped: Object.keys(PLUGIN.rules) };

function testedBy(runner) {
  const calls = globSync("eslint/**/*.test.mjs", { cwd: ROOT }).flatMap(file => [...readFileSync(resolve(ROOT, file), "utf8").matchAll(new RegExp(`\\b${runner}\\("([\\w-]+)"`, "g"))]);

  return calls.map(([, rule]) => rule);
}

describe.each(Object.entries(RUNNERS))("%s", (runner, rules) => {
  const tested = testedBy(runner);

  test.each(rules)("%s is tested", rule => {
    expect(tested).toContain(rule);
  });

  test("tests only rules that exist", () => {
    expect(tested.filter(rule => !rules.includes(rule))).toEqual([]);
  });
});
