import { SearchTermHighlight } from "../types/highlight";

export function findMatchingLightColor(tag: string, highlights: SearchTermHighlight[]): string | null {
  return findMatch(tag, highlights)?.lightColor ?? null;
}

export function findMatchingDarkColor(tag: string, highlights: SearchTermHighlight[]): string | null {
  return findMatch(tag, highlights)?.darkColor ?? null;
}

function findMatch(tag: string, highlights: SearchTermHighlight[]): SearchTermHighlight | undefined {
  return highlights.find(highlight => matchesTag(highlight, tag));
}

function matchesTag(highlight: SearchTermHighlight, tag: string): boolean {
  const item = { tags: new Set([tag]) };
  return highlight.tags.some(t => t.matches(item));
}
