import { removeExtraWhiteSpace } from "./format";

export function convertToTagSet(tagString: string): Set<string> {
  tagString = removeExtraWhiteSpace(tagString);

  if (tagString === "") {
    return new Set();
  }
  return new Set(tagString.split(" ").sort());
}

export function convertToTagSetFast(tagString: string): Set<string> {
  if (tagString === "") {
    return new Set();
  }
  return new Set(tagString.split(" "));
}

export function convertToTagString(tagSet: Set<string>): string {
  if (tagSet.size === 0) {
    return "";
  }
  return Array.from(tagSet).sort().join(" ");
}
