import { ParsedTerm } from "@/core/domain/search/terms/parsed_term";

export function parseSearchTermNegation(term: string): ParsedTerm {
  const isNegated = term.startsWith("-") && term.length > 1;
  return { isNegated, value: isNegated ? term.substring(1) : term };
}
