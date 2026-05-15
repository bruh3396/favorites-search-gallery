import { SearchTermHighlight } from "../types/highlight";

export function findMatchingLightColor(tag: string, highlights: SearchTermHighlight[]): string | null {
  return findMatch(tag, highlights)?.lightColor ?? null;
}

export function findMatchingDarkColor(tag: string, highlights: SearchTermHighlight[]): string | null {
  return findMatch(tag, highlights)?.darkColor ?? null;
}

function findMatch(tag: string, highlights: SearchTermHighlight[]): SearchTermHighlight | undefined {
  return highlights.find(h => matchesTag(h, tag));
}

function matchesTag(highlight: SearchTermHighlight, tag: string): boolean {
  return highlight.exactTags.has(tag) || highlight.wildcardPatterns.some(p => p.test(tag));
}
