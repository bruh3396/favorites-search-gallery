import { AbstractTag } from "../tags/abstract_tag";
import { MetadataTag } from "../tags/metadata_tag";
import { WildcardTag } from "../tags/wildcard_tag";

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
  Prefix = 10,
  Includes = 15,
  Regex = 20
}
