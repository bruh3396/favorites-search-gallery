import { ScannedSearchOperator } from "@/core/domain/search/parsers/scanned_search_operator";
import { SearchExpressionOperator } from "@/core/domain/search/parsers/search_expression_operator";

const { open: OPEN, negatedOpen: NEGATED_OPEN, close: CLOSE, or: OR } = SearchExpressionOperator;
const WORD_SEPARATOR = /\s\s+| /g;

export function scanSearchSyntax(query: string): ScannedSearchOperator[] {
  const scannedSearchOperators: ScannedSearchOperator[] = [];
  const openIndexes: number[] = [];

  for (const { word, start, end } of splitWords(query)) {
    if (word === OPEN || word === NEGATED_OPEN) {
      openIndexes.push(scannedSearchOperators.length);
      scannedSearchOperators.push({ start, end, depth: openIndexes.length });
    } else if (word === CLOSE) {
      const openIndex = openIndexes.pop();

      if (openIndex === undefined) {
        scannedSearchOperators.push({ start, end, depth: 0 });
      } else {
        const openScannedSearchOperator = scannedSearchOperators[openIndex];

        scannedSearchOperators[openIndex] = { ...openScannedSearchOperator, matchedStart: start };
        scannedSearchOperators.push({ start, end, depth: openScannedSearchOperator.depth, matchedStart: openScannedSearchOperator.start });
      }
    } else if (word === OR) {
      scannedSearchOperators.push({ start, end, depth: openIndexes.length });
    }
  }
  return scannedSearchOperators;
}

function *splitWords(query: string): Generator<{ word: string; start: number; end: number }> {
  const trimmedQuery = query.trim();

  if (trimmedQuery === "") {
    return;
  }
  const offset = query.length - query.trimStart().length;
  let wordStart = 0;

  for (const separator of trimmedQuery.matchAll(WORD_SEPARATOR)) {
    yield { word: trimmedQuery.slice(wordStart, separator.index), start: offset + wordStart, end: offset + separator.index };
    wordStart = separator.index + separator[0].length;
  }
  yield { word: trimmedQuery.slice(wordStart), start: offset + wordStart, end: offset + trimmedQuery.length };
}
