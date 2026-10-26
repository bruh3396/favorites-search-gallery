import { WildcardMatchType } from "@/core/domain/search/terms/wildcard_match_type";

export interface WildcardResolutionInputs {
  readonly matchType: WildcardMatchType;
  readonly fragment: string;
  readonly fragments: string[];
  readonly regex: RegExp;
}
