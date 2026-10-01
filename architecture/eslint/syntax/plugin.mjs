import { builtinRules } from "eslint/use-at-your-own-risk";

export function createPlugin(names) {
  return { rules: Object.fromEntries(names.map(name => [name, builtinRules.get(name)])) };
}
