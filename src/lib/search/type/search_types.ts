import { AbstractSearchTag } from "../tag/abstract_search_tag";
import { MetadataSearchTag } from "../tag/metadata_search_tag";
import { WildcardSearchTag } from "../tag/wildcard_search_tag";

export type SearchQueryMetadata = {
  hasPositiveAndTag: boolean
  hasWildcardTag: boolean
  hasMetadataTag: boolean
  hasOrGroup: boolean
};

export type CategorizedTags = {
  positiveTags: AbstractSearchTag[]
  wildcardTags: WildcardSearchTag[]
  metadataTags: MetadataSearchTag[]
};

export enum WildcardMatchType {
  PREFIX = 10,
  CONTAINS = 15,
  REGEX = 20
}
