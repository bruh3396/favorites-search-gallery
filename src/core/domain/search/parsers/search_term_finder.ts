import { FoundSearchTerm } from "@/core/domain/search/parsers/found_search_term";
import { parseSearchTermNegation } from "@/core/domain/search/parsers/search_term_parser";

const TRAILING_WORD = /\S+$/;
const WORD_END = /\s|$/;

export function findSearchTerm(query: string, caret: number): FoundSearchTerm | undefined {
  const wordStart = query.slice(0, caret).search(TRAILING_WORD);

  if (wordStart === -1) {
    return undefined;
  }
  const wordEnd = caret + query.slice(caret).search(WORD_END);
  const word = query.slice(wordStart, wordEnd);
  const afterNegation = parseSearchTermNegation(word).isNegated ? wordStart + 1 : wordStart;
  const start = query[afterNegation] === "*" ? afterNegation + 1 : afterNegation;
  const prefix = query.slice(start, caret);
  return prefix === "" ? undefined : { start, end: wordEnd, prefix };
}
