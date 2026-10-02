import { afterAll, describe, it } from "vitest";
import { RuleTester } from "eslint";
import tsparser from "@typescript-eslint/parser";
import { resolve } from "node:path";
import { PLUGIN } from "#architecture/eslint/typed/typed.mjs";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const FIXTURES = resolve(import.meta.dirname, "../fixtures");
const FILENAME = resolve(FIXTURES, "src/features/favorites/model/model.ts");

const tester = new RuleTester({
  languageOptions: {
    parser: tsparser,
    sourceType: "module",
    parserOptions: { projectService: true, tsconfigRootDir: FIXTURES }
  }
});

export function runTyped(name, { valid, invalid = [] }) {
  const rule = PLUGIN.rules[name];
  const [messageId] = Object.keys(rule.meta.messages);

  tester.run(name, rule, {
    valid: valid.map(code => ({ filename: FILENAME, code })),
    invalid: invalid.map(([code, count]) => ({ filename: FILENAME, code, errors: Array(count).fill({ messageId }) }))
  });
}
