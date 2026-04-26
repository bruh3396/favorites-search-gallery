import { AliasMap } from "../../../../types/common_types";
import { Preferences } from "../../../../lib/preferences";
import { Storage } from "../../../../lib/core/storage";

const ALIAS_MAP = {} as AliasMap;

export function get(tag: string): Set<string> | undefined {
  return ALIAS_MAP[tag];
}

export function has(tag: string): boolean {
  return Preferences.tagAliasingEnabled.value && get(tag) !== undefined;
}

export function setupAliases(): void {
  const aliasMap: Record<string, string[]> = Storage.get<Record<string, string[]>>("aliasMap") ?? {};

  for (const [tag, aliases] of Object.entries(aliasMap)) {
    ALIAS_MAP[tag] = new Set(aliases);
  }
}
