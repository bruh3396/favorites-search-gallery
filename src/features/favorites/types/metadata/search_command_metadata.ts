import { MetadataSearchTag } from "../../../../types/metadata_search_tag";
import { SearchTag } from "../../../../types/search_tag";
import { WildcardSearchTag } from "../../../../types/wildcard_search_tag";

export type SearchCommandMetadata = {
  normalTags: SearchTag[]
  wildcardTags: WildcardSearchTag[]
  metadataTags: MetadataSearchTag[]
  hasNormalTag: boolean
  hasWildcardTag: boolean
  hasMetadataTag: boolean
  hasOrGroup: boolean
}
