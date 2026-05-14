import { SearchTermHighlight } from "../types/highlight";

export function findMatchingTermColor(tag: string, highlights: SearchTermHighlight[]): string | null {
  return highlights.find(h => matchesTag(h, tag))?.color ?? null;
}

function matchesTag(highlight: SearchTermHighlight, tag: string): boolean {
  return highlight.exactTags.has(tag) || highlight.wildcardPatterns.some(p => p.test(tag));
}
