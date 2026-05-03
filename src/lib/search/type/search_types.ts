import { AbstractTag } from "../tag/abstract_tag";
import { MetadataTag } from "../tag/metadata_tag";
import { WildcardTag } from "../tag/wildcard_tag";

export type SearchQueryMetadata = {
  hasPositiveAndTag: boolean
  hasWildcardTag: boolean
  hasMetadataTag: boolean
  hasOrGroup: boolean
};

export type CategorizedTags = {
  positiveTags: AbstractTag[]
  wildcardTags: WildcardTag[]
  metadataTags: MetadataTag[]
};

export enum WildcardMatchType {
  PREFIX = 10,
  INCLUDES = 15,
  REGEX = 20
}
