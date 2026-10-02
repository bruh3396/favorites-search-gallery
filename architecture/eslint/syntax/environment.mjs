import { COMPOSITION_ROOTS, FEATURES, TESTS } from "#architecture/eslint/syntax/scopes.mjs";
import { createPlugin } from "#architecture/eslint/syntax/plugin.mjs";

export const MESSAGES = {
  rule41: "rule 41: only composition roots compare or switch on mode, device, pointer, or canvasBudget; inject a strategy chosen there",
  rule42: "rule 42: there is no device; key variation on a capability such as pointer or canvasBudget",
  rule43: "rule 43: only composition roots read the environment; take the strategy or value they derive from it",
  rule44: "rule 44: no config objects; a tuning value is an unexported UPPER_SNAKE const in the file that owns the mechanism",
  rule45: "rule 45: there are no flags; gate features through the mode-keyed feature table"
};

const ENVIRONMENT_FIELD = "/^(mode|device|pointer|canvasBudget)$/";

const SELECTORS = {
  rule41: [
    `BinaryExpression[operator=/^[!=]==?$/] > MemberExpression[property.name=${ENVIRONMENT_FIELD}]`,
    `SwitchStatement > MemberExpression.discriminant[property.name=${ENVIRONMENT_FIELD}]`
  ],
  rule42: ["Identifier[name=/^[dD]evice$/]", "Literal[value='device']"],
  rule43: ["Identifier[name='environment']"],
  rule44: ["Identifier[name=/Config$/]"],
  rule45: ["Identifier[name=/^[fF]lags$/]", "ImportDeclaration[source.value=/(^|\\/)flags(\\.ts)?$/]"]
};

const PLUGIN = createPlugin(["no-restricted-syntax"]);

function createBlock(name, files, ignores, rules) {
  return {
    files,
    ignores,
    plugins: { [name]: PLUGIN },
    rules: { [`${name}/no-restricted-syntax`]: ["error", ...rules.flatMap(rule => SELECTORS[rule].map(selector => ({ selector, message: MESSAGES[rule] })))] }
  };
}

export const CONFIGS = [
  createBlock("environment", FEATURES, [...TESTS, ...COMPOSITION_ROOTS], ["rule41", "rule43", "rule44"]),
  createBlock("variation", ["src/**/*.ts"], [], ["rule42", "rule45"])
];
