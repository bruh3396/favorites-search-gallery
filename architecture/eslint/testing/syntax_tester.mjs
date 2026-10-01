import { describe, expect, test } from "vitest";
import { Linter } from "eslint";
import tsparser from "@typescript-eslint/parser";
import { resolve } from "node:path";
import { MESSAGES, SYNTAX } from "#architecture/eslint/syntax/syntax.mjs";

const ROOT = resolve(import.meta.dirname, "../fixtures");
const CONFIG = [{ files: ["**/*.ts"], languageOptions: { parser: tsparser, sourceType: "module" } }, ...SYNTAX];
const linter = new Linter({ cwd: ROOT });

function messagesFor(file, code) {
  return linter.verify(code, CONFIG, resolve(ROOT, "src", file));
}

function expectParsed(messages) {
  expect(messages.filter(message => message.fatal)).toEqual([]);
}

function reportsOf(messages, rule) {
  return messages.filter(message => message.message.endsWith(MESSAGES[rule]));
}

export function runSyntax(rule, { valid, invalid = [] }) {
  describe(rule, () => {
    test.each(valid)("%s allows %s", (file, code) => {
      const messages = messagesFor(file, code);

      expectParsed(messages);
      expect(reportsOf(messages, rule)).toEqual([]);
    });

    test.each(invalid)("%s reports %s", (file, code) => {
      const messages = messagesFor(file, code);

      expectParsed(messages);
      expect(reportsOf(messages, rule)).not.toEqual([]);
    });
  });
}
