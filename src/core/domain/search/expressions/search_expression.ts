import { SearchTerm } from "@/core/domain/search/terms/search_term";

type SearchExpressionNode =
  | { readonly kind: "term"; readonly term: SearchTerm }
  | { readonly kind: "and"; readonly childExpressions: SearchExpression[] }
  | { readonly kind: "or"; readonly childExpressions: SearchExpression[] }
  | { readonly kind: "not"; readonly childExpression: SearchExpression };

export class SearchExpression {
  public static term(searchTerm: SearchTerm): SearchExpression {
    return new SearchExpression({ kind: "term", term: searchTerm });
  }

  public static and(childSearchExpressions: SearchExpression[]): SearchExpression {
    return new SearchExpression({ kind: "and", childExpressions: childSearchExpressions });
  }

  public static or(childSearchExpressions: SearchExpression[]): SearchExpression {
    return new SearchExpression({ kind: "or", childExpressions: childSearchExpressions });
  }

  public static not(childSearchExpression: SearchExpression): SearchExpression {
    return new SearchExpression({ kind: "not", childExpression: childSearchExpression });
  }

  constructor(public readonly node: SearchExpressionNode) { }
}
