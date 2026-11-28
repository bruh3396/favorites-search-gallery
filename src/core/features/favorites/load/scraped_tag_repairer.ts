export class ScrapedTagRepairer {
  private tagNameByTruncatedFirstTag: ReadonlyMap<string, string> = new Map();
  private tagNameByTruncatedLastTag: ReadonlyMap<string, string> = new Map();

  public prime(tagNames: ReadonlySet<string>): void {
    this.tagNameByTruncatedFirstTag = mapTruncatedNamesToTagNames(tagNames, removeFirstCharacter);
    this.tagNameByTruncatedLastTag = mapTruncatedNamesToTagNames(tagNames, removeLastCharacter);
  }

  public repair(tags: string): string {
    const tagNames = tags.split(" ");
    const lastIndex = tagNames.length - 1;
    return tagNames.map((tagName, index) => {
      if (index === 0) {
        return this.tagNameByTruncatedFirstTag.get(tagName) ?? tagName;
      }
      return index === lastIndex ? this.tagNameByTruncatedLastTag.get(tagName) ?? tagName : tagName;
    }).join(" ");
  }
}

function removeFirstCharacter(tagName: string): string {
  return tagName.slice(1);
}

function removeLastCharacter(tagName: string): string {
  return tagName.slice(0, -1);
}

function mapTruncatedNamesToTagNames(tagNames: ReadonlySet<string>, truncate: (tagName: string) => string): Map<string, string> {
  const tagNameByTruncatedName = new Map<string, string>();
  const ambiguousTruncatedNames = new Set<string>();

  for (const tagName of tagNames) {
    const truncatedName = truncate(tagName);

    if (truncatedName === "" || tagNames.has(truncatedName) || ambiguousTruncatedNames.has(truncatedName)) {
      continue;
    }

    if (tagNameByTruncatedName.has(truncatedName)) {
      tagNameByTruncatedName.delete(truncatedName);
      ambiguousTruncatedNames.add(truncatedName);
      continue;
    }
    tagNameByTruncatedName.set(truncatedName, tagName);
  }
  return tagNameByTruncatedName;
}
