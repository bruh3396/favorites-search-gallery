import {AliasMap} from "../types/primitives/composites";
import {Preferences} from "./preferences/preferences";

const ALIAS_MAP = {} as AliasMap;

function get(tag: string): Set<string> | undefined {
  return ALIAS_MAP[tag];
}

function has(tag: string): boolean {
  return Preferences.tagAliasing.value && Aliases.get(tag) !== undefined;
}

export const Aliases = {
  has,
  get
};

export function setupAliases(): void {
  const aliasMap: Record<string, string[]> = JSON.parse(localStorage.getItem("aliasMap") || "{}");

  for (const [tag, aliases] of Object.entries(aliasMap)) {
    ALIAS_MAP[tag] = new Set(aliases);
  }
}
