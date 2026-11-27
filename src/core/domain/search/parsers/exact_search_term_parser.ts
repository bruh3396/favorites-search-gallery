import { ExactSearchTerm } from "@/core/domain/search/terms/exact_search_term";
import { parseSearchTermNegation } from "@/core/domain/search/parsers/search_term_negation_parser";

export function parseExactSearchTerm(term: string): ExactSearchTerm {
  return new ExactSearchTerm(parseSearchTermNegation(term));
}
