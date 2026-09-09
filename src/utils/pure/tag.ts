export function toTagSet(tagString: string): Set<string> {
  if (tagString === "") {
    return new Set();
  }
  return new Set(tagString.split(" "));
}

export function toSortedTagSet(tagString: string): Set<string> {
  const set = new Set<string>();

  for (const tag of tagString.split(/\s+/).sort()) {
    if (tag !== "") {
      set.add(tag);
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
