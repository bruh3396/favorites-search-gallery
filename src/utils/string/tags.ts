import { removeExtraWhiteSpace } from "@/utils/string/format";

export function toTagSet(tagString: string): Set<string> {
  tagString = removeExtraWhiteSpace(tagString);
  return tagString === "" ? new Set() : new Set(tagString.split(" ").sort());
}

export function convertToSortedTagString(tagSet: Set<string>): string {
  return tagSet.size === 0 ? "" : Array.from(tagSet).sort().join(" ");
}

export function toTagString(tagSet: Set<string>): string {
  return tagSet.size === 0 ? "" : Array.from(tagSet).join(" ");
}
