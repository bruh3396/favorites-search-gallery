import { AbstractSearchTerm } from "@/core/search/terms/abstract_search_term";

type SearchExpressionNode =
  | { readonly kind: "term"; readonly term: AbstractSearchTerm }
  | { readonly kind: "and"; readonly children: SearchExpression[] }
  | { readonly kind: "or"; readonly children: SearchExpression[] }
  | { readonly kind: "not"; readonly child: SearchExpression };

export class SearchExpression {
  public static term(term: AbstractSearchTerm): SearchExpression {
    return new SearchExpression({ kind: "term", term });
  }

  public static and(children: SearchExpression[]): SearchExpression {
    return new SearchExpression({ kind: "and", children });
  }

  public static or(children: SearchExpression[]): SearchExpression {
    return new SearchExpression({ kind: "or", children });
  }

  public static not(child: SearchExpression): SearchExpression {
    return new SearchExpression({ kind: "not", child });
  }

  constructor(public readonly node: SearchExpressionNode) { }
}
