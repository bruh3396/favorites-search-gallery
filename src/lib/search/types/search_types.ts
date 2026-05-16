import { AbstractSearchTerm } from "../terms/abstract_term";
import { MetadataSearchTerm } from "../terms/metadata_term";
import { WildcardSearchTerm } from "../terms/wildcard_term";

export type SearchQueryMetadata = {
  hasPositiveAndTag: boolean
  hasWildcardTag: boolean
  hasMetadataTag: boolean
  hasOrGroup: boolean
};

export type CategorizedTags = {
  positiveTags: AbstractSearchTerm[]
  wildcardTags: WildcardSearchTerm[]
  metadataTags: MetadataSearchTerm[]
};

export enum WildcardMatchType {
  Prefix = 10,
  Includes = 15,
  Regex = 20
}
