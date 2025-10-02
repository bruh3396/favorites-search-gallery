import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default defineConfig([
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "**/*.min.js",
      "**/*.js"
      // "**/*.mjs"
    ]
  },
  {
    files: ["**/*.{mjs,cjs,ts}"],
    // files: ["**/*.{cjs,ts}"],
    plugins: {
      js
    },
    extends: ["js/recommended"]
  },
  {
    files: ["**/*.{mjs,cjs,ts}"],
    languageOptions: {
      globals: globals.browser
    }
  },
  tseslint.configs.recommended,
  {
    rules: {
      "accessor-pairs": "error",
      "array-bracket-newline": "error",
      "array-bracket-spacing": "error",
      "array-callback-return": "error",
      "arrow-spacing": "error",
      "block-scoped-var": "error",
      "block-spacing": "error",
      "brace-style": "error",
      // "callback-return": "error",
      "camelcase": "error",
      "comma-dangle": "error",
      "comma-spacing": "error",
      "comma-style": "error",
      "complexity": "error",
      "computed-property-spacing": "error",
      "consistent-return": "error",

      "consistent-this": "error",
      "constructor-super": "error",
      "curly":
        "off",
      "default-case": "error",
      "default-case-last": "error",
      "default-param-last": "error",
      "dot-notation": "error",
      "eol-last": "error",
      "eqeqeq": "error",
      "for-direction": "error",
      "func-call-spacing": "error",
      "func-name-matching": "error",
      "func-names": "error",
      "function-paren-newline": "error",
      "generator-star-spacing": "error",
      "getter-return": "error",
      "global-require": "error",
      "grouped-accessor-pairs": "error",
      "guard-for-in": "error",
      "handle-callback-err": "error",
      "id-blacklist": "error",
      "id-denylist": "error",
      "id-match": "error",
      "implicit-arrow-linebreak": "error",
      "jsx-quotes": "error",
      "key-spacing": "error",
      "keyword-spacing": "error",
      "lines-around-directive": "error",
      "max-classes-per-file": ["error"],
      "max-depth": "error",
      "max-nested-callbacks": "error",
      "max-statements-per-line": "error",
      "multiline-ternary": [
        "error",
        "never"
      ],
      "new-cap": "error",
      "new-parens": "error",
      "no-array-constructor": "error",
      "no-async-promise-executor": "error",
      "no-bitwise": "error",
      "no-buffer-constructor": "error",
      "no-caller": "error",
      "no-case-declarations": "error",
      "no-catch-shadow": "error",
      "no-class-assign": "error",
      "no-compare-neg-zero": "error",
      "no-cond-assign": "error",
      "no-confusing-arrow": "error",
      "no-const-assign": "error",
      "no-constant-binary-expression": "error",
      "no-constant-condition": "error",
      "no-constructor-return": "error",
      "no-continue": "off",
      "no-control-regex": "error",
      "no-debugger": "error",
      "no-delete-var": "error",
      "no-div-regex": "error",
      "no-dupe-args": "error",
      "no-dupe-class-members": "error",
      "no-dupe-else-if": "error",
      "no-dupe-keys": "error",
      "no-duplicate-case": "error",
      "no-duplicate-imports": "error",
      "no-else-return": "error",
      "no-empty": "error",
      "no-empty-character-class": "error",
      "no-empty-function": "off",
      "no-empty-pattern": "error",
      "no-empty-static-block": "error",
      "no-eq-null": "error",
      "no-eval": "error",
      "no-ex-assign": "error",
      // "no-extend-native": [
      //   "error"
      // ],
      "no-extra-bind": "error",
      "no-extra-boolean-cast": "error",
      "no-extra-label": "error",
      "no-extra-semi": "error",
      "no-fallthrough": "off",
      "no-floating-decimal": "error",
      "no-func-assign": "error",
      "no-global-assign": "error",
      "no-implicit-coercion": "error",
      "no-implicit-globals": "error",
      "no-implied-eval": "error",
      "no-import-assign": "error",
      "no-inline-comments": [
        "error",
        {
          "ignorePattern": "type"
        }
      ],
      "no-inner-declarations": "error",
      "no-invalid-regexp": "error",
      "no-invalid-this": "error",
      "no-irregular-whitespace": "error",
      "no-iterator": "error",
      "no-label-var": "error",
      "no-labels": "error",
      "no-lone-blocks": "error",
      "no-lonely-if": "error",
      "no-loop-func": "error",
      "no-loss-of-precision": "error",
      "no-misleading-character-class": "error",
      "no-mixed-operators": "error",
      "no-mixed-requires": "error",
      "no-mixed-spaces-and-tabs": "error",
      "no-multi-assign": "error",
      "no-multi-spaces": "error",
      "no-multi-str": "error",
      "no-multiple-empty-lines": [
        "error", {
          "max": 1,
          "maxEOF": 0,
          "maxBOF": 0
        }
      ],
      "no-native-reassign": "error",
      "no-negated-condition": "error",
      "no-negated-in-lhs": "error",
      // "no-new": [
      //   "error"
      // ],
      "no-new-func": "error",
      "no-new-native-nonconstructor": "error",
      "no-new-object": "error",
      "no-new-require": "error",
      "no-new-symbol": "error",
      "no-new-wrappers": "error",
      "no-nonoctal-decimal-escape": "error",
      "no-obj-calls": "error",
      "no-object-constructor": "error",
      "no-octal": "error",
      "no-octal-escape": "error",
      "no-path-concat": "error",
      "no-plusplus": "error",
      "no-process-env": "error",
      "no-process-exit": "error",
      "no-proto": "error",
      "no-prototype-builtins": "error",
      "no-redeclare": "error",
      "no-regex-spaces": "error",
      "no-restricted-exports": "error",
      "no-restricted-globals": "error",
      "no-restricted-imports": "error",
      "no-restricted-modules": "error",
      "no-restricted-properties": "error",
      "no-restricted-syntax": "error",
      "no-return-assign": "error",
      "no-return-await": "error",
      "no-script-url": "error",
      "no-self-assign": "error",
      "no-self-compare": "error",
      "no-sequences": "error",
      "no-setter-return": "error",
      "no-shadow": "error",
      "no-shadow-restricted-names": "error",
      "no-spaced-func": "error",
      "no-sparse-arrays": "error",
      "no-sync": "error",
      "no-tabs": "error",
      "no-template-curly-in-string": "error",
      "no-this-before-super": "error",
      "no-throw-literal": "error",
      "no-trailing-spaces": "error",
      "no-undef-init": "error",
      "no-underscore-dangle": "error",
      "no-unexpected-multiline": "error",
      "no-unmodified-loop-condition": "error",
      "no-unneeded-ternary": "error",
      "no-unreachable": "error",
      "no-unreachable-loop": "error",
      "no-unsafe-finally": "error",
      "no-unsafe-negation": "error",
      "no-unsafe-optional-chaining": "error",
      "no-unused-labels": "error",
      "no-useless-assignment": "error",
      "no-useless-backreference": "error",
      "no-useless-call": "error",
      "no-useless-catch": "error",
      "no-useless-computed-key": "error",
      "no-useless-concat": "error",
      "no-useless-constructor": "error",
      // "no-useless-escape": [
      //   "error"
      // ],
      "no-useless-rename": "error",
      "no-useless-return": "error",
      "no-var": "error",
      "no-void": "error",
      "no-warning-comments": "error",
      "no-whitespace-before-property": "error",
      "no-with": "error",
      "nonblock-statement-body-position": "error",
      // "object-curly-newline": [
      //   "error",
      //   {
      //     "ObjectExpression": {
      //       "multiline": true,
      //       "minProperties": 1
      //     }
      //   }
      // ],
      // "object-curly-spacing": "error",
      // "object-property-newline": "error",
      "object-shorthand": "error",
      "one-var-declaration-per-line": "error",
      "operator-assignment": "error",
      "operator-linebreak": "error",
      "prefer-arrow-callback": "error",
      "prefer-const": "error",
      "prefer-exponentiation-operator": "error",
      "prefer-numeric-literals": "error",
      "prefer-object-has-own": "error",
      "prefer-object-spread": "error",
      "prefer-promise-reject-errors": "error",
      // "prefer-reflect": [
      //   "error"
      // ],
      "prefer-regex-literals": "error",
      "prefer-rest-params": "error",
      "prefer-spread": "error",
      "prefer-template": "error",
      "quotes": "error",
      "require-atomic-updates": "error",
      "require-await": "error",
      "require-yield": "error",
      "rest-spread-spacing": "error",
      "semi": "error",
      "semi-spacing": "error",
      "semi-style": "error",
      "sort-imports": [
        "error", {
          // "memberSyntaxSortOrder": ["none", "all", "multiple", "single"]
        }
      ],
      "sort-vars": "error",
      "space-before-blocks": "error",
      "space-before-function-paren": [
        "error",
        "never"
      ],
      "space-in-parens": "error",
      "space-infix-ops": "error",
      "space-unary-ops": "error",
      "spaced-comment": "error",
      "switch-colon-spacing": "error",
      "symbol-description": "error",
      "template-curly-spacing": "error",
      "template-tag-spacing": "error",
      "unicode-bom": "error",
      "use-isnan": "error",
      "valid-typeof": "error",
      "vars-on-top": "error",
      "wrap-iife": "error",
      "wrap-regex": "error",
      "yield-star-spacing": "error",
      "yoda": "error",
      "linebreak-style": ["error", "windows"],
      "padding-line-between-statements": [
        "error",
        {
          blankLine: "always",
          prev: ["const", "let", "class", "function"],
          next: "*"
        },
        {
          blankLine: "always",
          prev: ["case", "default"],
          next: "*"
        },
        {
          blankLine: "any",
          prev: ["const", "let", "var"],
          next: ["const", "let", "var"]
        },
        {
          blankLine: "always",
          prev: "*",
          next: ["for", "if", "while", "switch", "case", "function", "class"]
        },
        {
          blankLine: "never",
          prev: "*",
          next: "return"
        }
      ],
      "no-console": [
        "warn",
        {
          allow: ["warn", "error"]
        }
      ],
      "multiline-comment-style": "off",
      // "@typescript-eslint/explicit-module-boundary-types": "error",
      "@typescript-eslint/explicit-module-boundary-types": "error",
      "@typescript-eslint/explicit-function-return-type": "error",

      "@typescript-eslint/explicit-member-accessibility": [
        "error", {
          "accessibility": "explicit",
          "overrides": {
            // "accessors": "off",
            "constructors": "no-public",
            "methods": "explicit",
            "properties": "explicit",
            "parameterProperties": "explicit"
          }
        }
      ],
      "@typescript-eslint/member-ordering": [
        "error", {
          default: [
            // "public-static-field",
            // "protected-static-field",
            // "private-static-field",

            // "public-static-method",
            // "protected-static-method",
            // "private-static-method",

            // "public-instance-field",
            // "protected-instance-field",
            // "private-instance-field",

            // "public-constructor",
            // "protected-constructor",
            // "private-constructor",

            // "public-instance-method",
            // "protected-instance-method",
            // "private-instance-method"

            // Index signature
            "signature",
            "call-signature",

            // Fields
            "public-static-field",
            "protected-static-field",
            "private-static-field",
            "#private-static-field",

            "public-decorated-field",
            "protected-decorated-field",
            "private-decorated-field",

            "public-instance-field",
            "protected-instance-field",
            "private-instance-field",
            "#private-instance-field",

            "public-abstract-field",
            "protected-abstract-field",

            "public-field",
            "protected-field",
            "private-field",
            "#private-field",

            "static-field",
            "instance-field",
            "abstract-field",

            "decorated-field",

            "field",

            // Static initialization
            "static-initialization",

            // Constructors
            "public-constructor",
            "protected-constructor",
            "private-constructor",

            "constructor",

            // Accessors
            "public-static-accessor",
            "protected-static-accessor",
            "private-static-accessor",
            "#private-static-accessor",

            "public-decorated-accessor",
            "protected-decorated-accessor",
            "private-decorated-accessor",

            "public-instance-accessor",
            "protected-instance-accessor",
            "private-instance-accessor",
            "#private-instance-accessor",

            "public-abstract-accessor",
            "protected-abstract-accessor",

            "public-accessor",
            "protected-accessor",
            "private-accessor",
            "#private-accessor",

            "static-accessor",
            "instance-accessor",
            "abstract-accessor",

            "decorated-accessor",

            "accessor",

            // Getters
            "public-static-get",
            "protected-static-get",
            "private-static-get",
            "#private-static-get",

            "public-decorated-get",
            "protected-decorated-get",
            "private-decorated-get",

            "public-instance-get",
            "protected-instance-get",
            "private-instance-get",
            "#private-instance-get",

            "public-abstract-get",
            "protected-abstract-get",

            "public-get",
            "protected-get",
            "private-get",
            "#private-get",

            "static-get",
            "instance-get",
            "abstract-get",

            "decorated-get",

            "get",

            // Setters
            "public-static-set",
            "protected-static-set",
            "private-static-set",
            "#private-static-set",

            "public-decorated-set",
            "protected-decorated-set",
            "private-decorated-set",

            "public-instance-set",
            "protected-instance-set",
            "private-instance-set",
            "#private-instance-set",

            "public-abstract-set",
            "protected-abstract-set",

            "public-set",
            "protected-set",
            "private-set",
            "#private-set",

            "static-set",
            "instance-set",
            "abstract-set",

            "decorated-set",

            "set",

            // Methods
            "public-static-method",
            "protected-static-method",
            "private-static-method",
            "#private-static-method",

            "public-decorated-method",
            "protected-decorated-method",
            "private-decorated-method",

            "public-instance-method",
            "protected-instance-method",
            "private-instance-method",
            "#private-instance-method",

            "public-abstract-method",
            "protected-abstract-method",

            "public-method",
            "protected-method",
            "private-method",
            "#private-method",

            "static-method",
            "instance-method",
            "abstract-method",

            "decorated-method",

            "method"
          ]
        }
      ]
    }
  }
]);
