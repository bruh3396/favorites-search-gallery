export function toTagSet(tagString: string): Set<string> {
  return tagString === "" ? new Set() : new Set(tagString.split(" "));
}

export function toSortedTagSet(tagString: string): Set<string> {
  const tags = tagString.split(/\s+/).sort();
  const set = new Set(tags);

  set.delete("");
  return set;
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
