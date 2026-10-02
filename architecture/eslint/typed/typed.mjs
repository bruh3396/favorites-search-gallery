import { resolve } from "node:path";
import { LEGACY_MODEL, TESTS } from "#architecture/eslint/syntax/scopes.mjs";
import { noAppContext } from "#architecture/eslint/typed/no_app_context.mjs";
import { noDomTypes } from "#architecture/eslint/typed/no_dom_types.mjs";
import { noLocalPostsReads } from "#architecture/eslint/typed/no_local_posts_reads.mjs";

export const PLUGIN = { rules: { "no-dom-types": noDomTypes, "no-app-context": noAppContext, "no-local-posts-reads": noLocalPostsReads } };

const PARSER_OPTIONS = { projectService: true, tsconfigRootDir: resolve(import.meta.dirname, "../../..") };

function createBlock(files, ignores, rule) {
  return { files, ignores, plugins: { architecture: PLUGIN }, languageOptions: { parserOptions: PARSER_OPTIONS }, rules: { [`architecture/${rule}`]: "error" } };
}

export const TYPED = [
  createBlock(LEGACY_MODEL, TESTS, "no-dom-types"),
  createBlock(["src/{core/,}features/*/features/*/**/*.ts"], TESTS, "no-app-context"),
  createBlock(["src/**/*.ts"], [...TESTS, "src/{core/,}features/favorites/model/posts/library.ts", "src/adapters/**", "src/targets/**"], "no-local-posts-reads")
];
