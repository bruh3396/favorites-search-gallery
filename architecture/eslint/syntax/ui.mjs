import { createPlugin } from "#architecture/eslint/syntax/plugin.mjs";

export const MESSAGES = {
  rule107: "rule 107: core/ui uses no ids; hold references, query tests by role or label, and relate elements with popoverTargetElement, ariaLabelledByElements, or nesting",
  rule108: "rule 108: state is a native or ARIA attribute (:disabled, aria-checked, aria-pressed, aria-expanded); data-* is only for presentation variants such as data-size"
};

const QUERY = "CallExpression[callee.property.name=/^(querySelector|querySelectorAll|closest|matches)$/]";
const ATTRIBUTE = "CallExpression[callee.property.name=/^(get|set|has|remove|toggle)Attribute(NS)?$/]";
const STATE = "(checked|disabled|selected|state|pressed|expanded|active)";

const SELECTORS = {
  rule107: [
    "AssignmentExpression > MemberExpression.left[property.name='id']",
    `${ATTRIBUTE} > Literal.arguments[value='id']`,
    "CallExpression[callee.property.name='getElementById']",
    `${QUERY} > Literal.arguments[value=/#/]`,
    `${QUERY} > TemplateLiteral.arguments > TemplateElement[value.raw=/#/]`
  ],
  rule108: [
    `MemberExpression[object.property.name='dataset'][property.name=/^${STATE}$/]`,
    `${ATTRIBUTE} > Literal.arguments[value=/^data-${STATE}$/]`
  ]
};

const PLUGIN = createPlugin(["no-restricted-syntax"]);

export const CONFIGS = [
  {
    files: ["src/core/ui/**/*.ts"],
    plugins: { ui: PLUGIN },
    rules: { "ui/no-restricted-syntax": ["error", ...Object.entries(SELECTORS).flatMap(([rule, selectors]) => selectors.map(selector => ({ selector, message: MESSAGES[rule] })))] }
  }
];
