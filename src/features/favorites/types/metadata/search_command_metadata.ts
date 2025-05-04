import { MetadataSearchTag } from "../../model/search/search_tags/metadata_search_tag";
import { SearchTag } from "../../model/search/search_tags/search_tag";
import { WildcardSearchTag } from "../../model/search/search_tags/wildcard_search_tag";

export type SearchCommandMetadata = {
  normalTags: SearchTag[]
  wildcardTags: WildcardSearchTag[]
  metadataTags: MetadataSearchTag[]
  hasNormalTag: boolean
  hasWildcardTag: boolean
  hasMetadataTag: boolean
  hasOrGroup: boolean
}
