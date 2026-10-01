import { expect, test } from "vitest";
import ts from "typescript";
import { resolve } from "node:path";

const CONFIG_PATH = resolve(import.meta.dirname, "core.json");
const GLOBALS_PATH = resolve(import.meta.dirname, "globals.d.ts");
const PROBE_PATH = resolve(import.meta.dirname, "../../src/core/utils/probe.ts");

function createOptions() {
  const { config } = ts.readConfigFile(CONFIG_PATH, ts.sys.readFile);

  return ts.parseJsonConfigFileContent(config, ts.sys, import.meta.dirname).options;
}

const OPTIONS = createOptions();

function diagnosticsFor(code) {
  const host = ts.createCompilerHost(OPTIONS);
  const getSourceFile = host.getSourceFile;

  host.fileExists = path => resolve(path) === PROBE_PATH || ts.sys.fileExists(path);
  host.readFile = path => (resolve(path) === PROBE_PATH ? code : ts.sys.readFile(path));
  host.getSourceFile = (path, language) => (resolve(path) === PROBE_PATH ? ts.createSourceFile(path, code, language) : getSourceFile(path, language));
  return ts.getPreEmitDiagnostics(ts.createProgram([GLOBALS_PATH, PROBE_PATH], OPTIONS, host)).map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
}

test.each([
  "console.log(new URL(\"https://example.com\").searchParams.get(\"a\"));",
  "new TextDecoder().decode(new TextEncoder().encode(\"a\"));",
  "new AbortController().signal.throwIfAborted();",
  "structuredClone({ a: 1 });",
  "queueMicrotask(() => undefined);",
  "export function sizeOf(blob: Blob): number { return blob.size; }"
])("core may use %s", code => {
  expect(diagnosticsFor(code)).toEqual([]);
});

test.each([
  "document.createElement(\"div\");",
  "window.innerWidth;",
  "export function rootOf(element: HTMLElement): HTMLElement { return element; }",
  "setTimeout(() => undefined, 1);",
  "fetch(\"https://example.com\");",
  "localStorage.getItem(\"a\");",
  "process.env;",
  "new Blob([]);",
  "new AbortController().signal.addEventListener(\"abort\", () => undefined);"
])("core may not use %s", code => {
  expect(diagnosticsFor(code)).not.toEqual([]);
});
