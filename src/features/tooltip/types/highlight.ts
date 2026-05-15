export interface SearchTermHighlight {
  exactTags: Set<string>
  wildcardPatterns: RegExp[]
  lightColor: string
  darkColor: string
}
