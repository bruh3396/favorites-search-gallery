import { afterAll, describe, it } from "vitest";
import { RuleTester } from "eslint";
import boundaries from "eslint-plugin-boundaries";
import tsparser from "@typescript-eslint/parser";
import { resolve } from "node:path";
import { FILES } from "#architecture/eslint/files.mjs";
import { IMPORTS, MESSAGES } from "#architecture/eslint/imports/imports.mjs";
import { LAYERS } from "#architecture/eslint/layers.mjs";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const FIXTURES = resolve(import.meta.dirname, "../fixtures");
const OPTIONS = [{ default: "allow", policies: IMPORTS }];

const tester = new RuleTester({
  languageOptions: { parser: tsparser, sourceType: "module" },
  settings: {
    "boundaries/elements": LAYERS,
    "boundaries/files": FILES,
    "boundaries/root-path": FIXTURES,
    "import/resolver": { typescript: { project: resolve(FIXTURES, "tsconfig.json") } }
  }
});

function createCase([file, specifier]) {
  return { filename: resolve(FIXTURES, "src", file), code: `import * as Module from "@/${specifier}";`, options: OPTIONS };
}

export function runRule(rule, { valid, invalid = [] }) {
  tester.run(rule, boundaries.rules.dependencies, {
    valid: valid.map(createCase),
    invalid: invalid.map((pair) => ({ ...createCase(pair), errors: [{ message: MESSAGES[rule] }] }))
  });
}
