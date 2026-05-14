export interface SearchTermHighlight {
  exactTags: Set<string>;
  wildcardPatterns: RegExp[];
  color: string;
}
