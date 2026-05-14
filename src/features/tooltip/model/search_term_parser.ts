import { SearchTermHighlight } from "../types/highlight";
import { parseTagGroups } from "../../../lib/search/parse/tag_group_parser";

export function parseSearchQueryIntoHighlights(rawSearchQuery: string): SearchTermHighlight[] {
  const { andTags, orGroups } = parseTagGroups(rawSearchQuery);
  const termGroups: string[][] = [...andTags.map(tag => [tag]), ...orGroups];
  return termGroups.map(g => createHighlightFromTagStrings(g))
    .filter(h => h !== null);
}

function createHighlightFromTagStrings(tagStrings: string[]): SearchTermHighlight | null {
  const exactTags = new Set<string>();
  const wildcardPatterns: RegExp[] = [];

  for (const tagString of tagStrings) {
    if (isUnHighlightableTagString(tagString)) {
      continue;
    }

    if (tagString.includes("*")) {
      wildcardPatterns.push(wildcardToRegex(tagString));
    } else {
      exactTags.add(tagString);
    }
  }

  if (exactTags.size === 0 && wildcardPatterns.length === 0) {
    return null;
  }
  return { exactTags, wildcardPatterns, color: "" };
}

function isUnHighlightableTagString(tagString: string): boolean {
  return tagString.startsWith("-") || tagString.includes(":");
}

function wildcardToRegex(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`);
}
