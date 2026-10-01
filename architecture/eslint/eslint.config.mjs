import boundaries from "eslint-plugin-boundaries";
import tsparser from "@typescript-eslint/parser";
import { FILES } from "#architecture/eslint/files.mjs";
import { IMPORTS } from "#architecture/eslint/imports/imports.mjs";
import { LAYERS } from "#architecture/eslint/layers.mjs";
import { SYNTAX } from "#architecture/eslint/syntax/syntax.mjs";

export default [
  { ignores: ["src/playground/**"] },
  {
    files: ["src/**/*.ts"],
    plugins: { boundaries },
    languageOptions: {
      parser: tsparser,
      parserOptions: { sourceType: "module" }
    },
    settings: {
      "boundaries/elements": LAYERS,
      "boundaries/files": FILES,
      "boundaries/include": ["src/**/*.ts"],
      "import/resolver": { typescript: { project: "tsconfig.json" } }
    },
    rules: {
      "boundaries/dependencies": ["error", { default: "allow", policies: IMPORTS }],
      "boundaries/no-unknown-files": "error"
    }
  },
  ...SYNTAX
];
