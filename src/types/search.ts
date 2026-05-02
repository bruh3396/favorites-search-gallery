export interface Searchable {
  tags: Set<string>
}
export type Rating = 1 | 2 | 3 | 4 | 5 | 6 | 7
export type TagCategory = "general" | "artist" | "unknown" | "copyright" | "character" | "metadata"
export type MetadataMetric = "default" | "id" | "score" | "width" | "height" | "creationTimestamp" | "lastChangedTimestamp" | "random" | "duration"
export type SortingMethod = MetadataMetric
export type SearchableMetadataMetric = "id" | "score" | "width" | "height" | "duration"
export type MetadataComparator = ":" | ":<" | ":>"
export type TagModificationDatabaseRecord = {
  id: string
  tags: string
}
export type AliasMap = Record<string, Set<string>>
export type TagCategoryMapping = {
  id: string
  category: TagCategory
}
export enum DiscreteRating {
  EXPLICIT = 4,
  QUESTIONABLE = 2,
  SAFE = 1
}

export function decodeRating(rating: string): Rating {
  return {
    "Explicit": DiscreteRating.EXPLICIT,
    "E": DiscreteRating.EXPLICIT,
    "e": DiscreteRating.EXPLICIT,
    "Questionable": DiscreteRating.QUESTIONABLE,
    "Q": DiscreteRating.QUESTIONABLE,
    "q": DiscreteRating.QUESTIONABLE,
    "Safe": DiscreteRating.SAFE,
    "S": DiscreteRating.SAFE,
    "s": DiscreteRating.SAFE
  }[rating] ?? DiscreteRating.EXPLICIT;
}
