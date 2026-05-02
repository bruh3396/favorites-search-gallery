import { AliasMap } from "../../../../types/search";
import { Preferences } from "../../../../lib/preferences/preferences";
import { Storage } from "../../../../lib/core/storage/storage_instance";

const aliasMap = {} as AliasMap;

export function get(tag: string): Set<string> | undefined {
  return aliasMap[tag];
}

export function has(tag: string): boolean {
  return Preferences.tagAliasing.value && get(tag) !== undefined;
}

export function setupAliases(): void {
  const aMap: Record<string, string[]> = Storage.get<Record<string, string[]>>("aliasMap") ?? {};

  for (const [tag, aliases] of Object.entries(aMap)) {
    aliasMap[tag] = new Set(aliases);
  }
}
