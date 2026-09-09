import { flatten } from "@/utils/pure/string";

const tagPool = new Map<string, string>();

export function tagPoolSize(): number {
  return tagPool.size;
}

export function internTag(tag: string): string {
  const existing = tagPool.get(tag);

  if (existing !== undefined) {
    return existing;
  }
  const flat = flatten(tag);

  tagPool.set(flat, flat);
  return flat;
}

export function internTags(tags: Iterable<string>): string[] {
  const unique = new Set<string>();

  for (const tag of tags) {
    if (tag !== "") {
      unique.add(internTag(tag));
    }
  }
  return [...unique];
}

export function toTagSet(tagString: string): Set<string> {
  if (tagString === "") {
    return new Set();
  }
  return new Set(tagString.split(" ").map(internTag));
}

export function toSortedTagSet(tagString: string): Set<string> {
  const set = new Set<string>();

  for (const tag of tagString.split(/\s+/).sort()) {
    if (tag !== "") {
      set.add(internTag(tag));
    }
  }
  return set;
}

export function toSortedTagArray(tagString: string): string[] {
  return [...toSortedTagSet(tagString)];
}

export function toTagString(tagSet: Set<string>): string {
  return tagSet.size === 0 ? "" : Array.from(tagSet).join(" ");
}

export function toSortedTagString(tagSet: Set<string>): string {
  return tagSet.size === 0 ? "" : Array.from(tagSet).sort().join(" ");
}

export function negateTags(tags: string): string {
  return tags.replace(/(\S+)/g, "-$1");
}
