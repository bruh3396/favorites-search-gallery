import { AbstractSearchTerm } from "@/lib/search/terms/abstract_search_term";
import { MetadataSearchTerm } from "@/lib/search/terms/metadata_search_term";
import { WildcardSearchTerm } from "@/lib/search/terms/wildcard_search_term";

export type SearchQueryMetadata = {
  hasRequiredTerm: boolean
  hasWildcardTerm: boolean
  hasMetadataTerm: boolean
  hasOrGroup: boolean
};

export type CategorizedSearchTerms = {
  required: AbstractSearchTerm[]
  wildcard: WildcardSearchTerm[]
  metadata: MetadataSearchTerm[]
};

export enum WildcardMatchType {
  Prefix = 10,
  Substring = 15,
  Regex = 20
}
