import { WildcardMatchType } from "@/core/domain/search/terms/wildcard_match_type";
import { WildcardSearchTerm } from "@/core/domain/search/terms/wildcard_search_term";
import { escapeParentheses } from "@/core/utils/string/string_utilities";
import { parseSearchTermNegation } from "@/core/domain/search/parsers/search_term_negation_parser";

const unmatchableRegex = /^\b$/;

export function parseWildcardSearchTerm(term: string): WildcardSearchTerm {
  const parsedTerm = parseSearchTermNegation(removeDuplicateAsterisks(term));
  return new WildcardSearchTerm(parsedTerm, { matchType: chooseWildcardMatchType(parsedTerm.value), regex: buildWildcardRegex(parsedTerm.value) });
}

function chooseWildcardMatchType(value: string): WildcardMatchType {
  const first = value.indexOf("*");
  const last = value.lastIndexOf("*");
  const hasSingleStar = first === last;

  if (hasSingleStar && last === value.length - 1) {
    return WildcardMatchType.Prefix;
  }

  if (hasSingleStar && first === 0) {
    return WildcardMatchType.Suffix;
  }

  if (first === 0 && last === value.length - 1 && value.indexOf("*", 1) === last) {
    return WildcardMatchType.Substring;
  }
  return WildcardMatchType.MultiStar;
}

function buildWildcardRegex(value: string): RegExp {
  try {
    const regex = escapeParentheses(value.replace(/\*/g, ".*"));
    return new RegExp(`^${regex}$`);
  } catch {
    return unmatchableRegex;
  }
}

function removeDuplicateAsterisks(value: string): string {
  return value.replace(/\*+/g, "*");
}
