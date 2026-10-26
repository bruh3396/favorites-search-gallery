import { WildcardMatchType } from "@/core/domain/search/terms/wildcard_match_type";

export interface WildcardPattern {
  readonly matchType: WildcardMatchType;
  readonly regex: RegExp;
}
