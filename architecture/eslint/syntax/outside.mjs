import { CORE, CORE_RENDERING, LEGACY_CONTROL, LEGACY_NO_DOM, TESTS } from "#architecture/eslint/syntax/scopes.mjs";
import { createPlugin } from "#architecture/eslint/syntax/plugin.mjs";

export const MESSAGES = {
  rule23: "rule 23: core reaches the network only through a port",
  rule24: "rule 24: core reaches storage only through a port",
  rule25: "rule 25: core reads and waits on time only through the Scheduler port",
  rule26: "rule 26: core reads the host page and browser only through a port",
  rule27: "rule 27: core draws randomness only through the Random port",
  rule28: "rule 28: core opens dialogs only through a port",
  rule29: "rule 29: core reaches files only through a port",
  rule29b: "rule 29: only view/ and core/ui create object URLs, to render a Blob they hold",
  rule30: "rule 30: only targets and adapter clients use the userscript manager's APIs",
  rule31: "rule 31: core opens windows only through Navigation or HostPage",
  rule33: "rule 33: flows/, types/, and the feature entry never touch document or window; go through the view facade",
  rule35: "rule 35: core reaches the page only through the root it is handed; create elements with root.ownerDocument, take window input from a port"
};

const RESTRICTIONS = {
  rule23: { globals: ["fetch", "XMLHttpRequest"] },
  rule24: { globals: ["indexedDB", "localStorage", "sessionStorage"] },
  rule25: {
    globals: ["setTimeout", "setInterval", "clearTimeout", "clearInterval", "requestAnimationFrame", "cancelAnimationFrame", "requestIdleCallback", "cancelIdleCallback", "performance"],
    properties: [["Date", "now"]],
    syntax: ["NewExpression[callee.name='Date'][arguments.length=0]"]
  },
  rule26: { globals: ["location", "navigator", "history"] },
  rule27: { globals: ["crypto"], properties: [["Math", "random"]] },
  rule28: { globals: ["alert", "confirm", "prompt"] },
  rule29: {
    globals: ["FileReader", "showSaveFilePicker", "showOpenFilePicker"],
    syntax: ["AssignmentExpression[left.property.name='download']"]
  },
  rule29b: { properties: [["URL", "createObjectURL"], ["URL", "revokeObjectURL"]] },
  rule30: {
    globals: ["GM", "unsafeWindow"],
    syntax: ["Identifier[name=/^GM_/]:not(:matches(TSDeclareFunction, VariableDeclarator, TSPropertySignature) > Identifier)"]
  },
  rule31: { globals: ["open"] },
  rule33: { globals: ["document", "window"] },
  rule35: { globals: ["document", "window"], properties: [[null, "defaultView"]] }
};

const CORE_RULES = Object.keys(RESTRICTIONS).filter(rule => rule !== "rule33");
const RENDERING_RULES = CORE_RULES.filter(rule => rule !== "rule29b");

const GLOBAL_OBJECTS = ["window", "globalThis"];
const PLUGIN = createPlugin(["no-restricted-globals", "no-restricted-properties", "no-restricted-syntax"]);

function globalsOf(rule) {
  return (RESTRICTIONS[rule].globals ?? []).map(name => ({ name, message: MESSAGES[rule] }));
}

function propertiesOf(rule) {
  const { globals = [], properties = [] } = RESTRICTIONS[rule];
  const viaGlobalObjects = GLOBAL_OBJECTS.flatMap(object => globals.map(name => [object, name]));

  return [...properties, ...viaGlobalObjects].map(([object, property]) => (object === null ? { property, message: MESSAGES[rule] } : { object, property, message: MESSAGES[rule] }));
}

function syntaxOf(rule) {
  return (RESTRICTIONS[rule].syntax ?? []).map(selector => ({ selector, message: MESSAGES[rule] }));
}

function createBlock(files, ignores, rules) {
  return {
    files,
    ignores,
    plugins: { outside: PLUGIN },
    rules: {
      "outside/no-restricted-globals": ["error", ...rules.flatMap(globalsOf)],
      "outside/no-restricted-properties": ["error", ...rules.flatMap(propertiesOf)],
      "outside/no-restricted-syntax": ["error", ...rules.flatMap(syntaxOf)]
    }
  };
}

export const CONFIGS = [
  createBlock(CORE, [...TESTS, ...CORE_RENDERING], CORE_RULES),
  createBlock(CORE_RENDERING, TESTS, RENDERING_RULES),
  createBlock(LEGACY_NO_DOM, TESTS, ["rule30", "rule33"]),
  createBlock(LEGACY_CONTROL, TESTS, ["rule28", "rule30", "rule31"]),
  createBlock(["src/**/*.ts"], [...CORE, ...LEGACY_NO_DOM, ...LEGACY_CONTROL, ...TESTS, "src/targets/**", "src/adapters/*/client/**"], ["rule30"])
];
