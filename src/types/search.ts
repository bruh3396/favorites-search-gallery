export type Rating = 1 | 2 | 3 | 4 | 5 | 6 | 7
export type TagCategory = "general" | "artist" | "unknown" | "copyright" | "character" | "metadata"
export type TagCategoryMap = Map<string, TagCategory>
export type MetadataMetric = "default" | "id" | "score" | "width" | "height" | "creationTimestamp" | "lastChangedTimestamp" | "random" | "duration"
export type SortMethod = MetadataMetric
export type SearchableMetadataMetric = "id" | "score" | "width" | "height" | "duration"
export type MetadataComparator = ":" | ":<" | ":>"

export type TagModificationDatabaseRecord = {
  id: string
  tags: string
}

export type TagCategoryMapping = {
  id: string
  category: TagCategory
}

export enum DiscreteRating {
  Explicit = 4,
  Questionable = 2,
  Safe = 1
}

export function decodeRating(rating: string): Rating {
  return {
    "Explicit": DiscreteRating.Explicit,
    "E": DiscreteRating.Explicit,
    "e": DiscreteRating.Explicit,
    "Questionable": DiscreteRating.Questionable,
    "Q": DiscreteRating.Questionable,
    "q": DiscreteRating.Questionable,
    "Safe": DiscreteRating.Safe,
    "S": DiscreteRating.Safe,
    "s": DiscreteRating.Safe
  }[rating] ?? DiscreteRating.Explicit;
}

export interface Searchable {
  tags: Set<string>
}
