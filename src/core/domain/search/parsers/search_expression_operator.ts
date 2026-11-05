export const SearchExpressionOperator = {
  open: "(",
  negatedOpen: "-(",
  close: ")",
  or: "~"
} as const;

const OPERATORS: readonly string[] = Object.values(SearchExpressionOperator);

export function isSearchExpressionOperator(word: string): boolean {
  return OPERATORS.includes(word);
}
