import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
import ts from "typescript";

const SOURCE_ROOT = "src";
const SKIPPED_FOLDERS = [/\/testing\//, /^src\/targets\//];
const OPTION_LIST = "an `as const` option list and its type; no behavior to test";
const FONT = "a font definition object; no behavior to test";
const UNTESTED: Readonly<Record<string, string>> = {
  "src/adapters/rule34/client/rule34_page_size.ts": "two page size constants; no behavior to test",
  "src/core/app/favorites/lightbox/tag_alignment.ts": OPTION_LIST,
  "src/core/app/favorites/lightbox/tag_organization.ts": OPTION_LIST,
  "src/core/app/favorites/lightbox/tag_size.ts": OPTION_LIST,
  "src/core/boundary/color_scheme.ts": OPTION_LIST,
  "src/core/domain/media/media_kind.ts": OPTION_LIST,
  "src/core/domain/post/post_status.ts": OPTION_LIST,
  "src/core/domain/post/rating.ts": OPTION_LIST,
  "src/core/domain/search/terms/wildcard_match_type.ts": "an enum; no behavior to test",
  "src/core/features/favorites/search/favorites_sort_key.ts": OPTION_LIST,
  "src/core/features/lightbox/lightbox_mode.ts": OPTION_LIST,
  "src/core/ui/fonts/default_app_font.ts": "an alias of another font; no behavior to test",
  "src/core/ui/fonts/geist_font.ts": FONT,
  "src/core/ui/fonts/instrument_font.ts": FONT,
  "src/core/ui/fonts/inter_font.ts": FONT,
  "src/core/ui/fonts/plex_font.ts": FONT,
  "src/core/ui/fonts/system_font.ts": FONT,
  "src/core/ui/fonts/verdana_font.ts": FONT,
  "src/core/ui/post_grid/layout/grid_layout.ts": OPTION_LIST,
  "src/core/utils/storage/stored_map_definition.ts": "a marker class holding its entry; covered through stored_tree"
};

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
