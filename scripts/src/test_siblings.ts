import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
import ts from "typescript";

const SOURCE_ROOT = "src";
const SKIPPED_FOLDERS = [/\/testing\//, /^src\/targets\//];
const UNTESTED: Readonly<Record<string, string>> = {};

function findSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name).replaceAll("\\", "/");

    if (entry.isDirectory()) {
      return findSourceFiles(path);
    }
    return /\.tsx?$/.test(path) && !/\.(test|d)\.tsx?$/.test(path) ? [path] : [];
  });
}

function hasRuntimeCode(file: string): boolean {
  const { outputText } = ts.transpileModule(readFileSync(file, "utf8"), {
    fileName: file,
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ESNext, jsx: ts.JsxEmit.Preserve }
  });
  return outputText
    .replace(/^\s*import\s[^;]*;\s*$/gm, "")
    .replace(/export\s*\{\s*\};?/g, "")
    .replace(/\/\/.*$/gm, "")
    .trim() !== "";
}

function hasSiblingTest(file: string): boolean {
  return [".test.ts", ".test.tsx"].some(extension => existsSync(file.replace(/\.tsx?$/, extension)));
}

function report(files: readonly string[], problem: string): void {
  for (const file of files) {
    console.error(`✘ ${file} ${problem}`);
  }
}

function checkTestSiblings(): void {
  const missing = findSourceFiles(SOURCE_ROOT).filter(file =>
    !SKIPPED_FOLDERS.some(folder => folder.test(file)) && !(file in UNTESTED) && hasRuntimeCode(file) && !hasSiblingTest(file));
  const stale = Object.keys(UNTESTED).filter(file => !existsSync(file) || hasSiblingTest(file));

  report(missing, "has no sibling test");
  report(stale, "is listed as untested but no longer needs to be");

  if (missing.length + stale.length > 0) {
    process.exitCode = 1;
  } else {
    console.log("✔ Every source file has a sibling test.");
  }
}

checkTestSiblings();
