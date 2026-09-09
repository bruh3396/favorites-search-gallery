import { AbstractSearchTerm } from "@/lib/search/terms/abstract_search_term";

export type Node =
  | { kind: "term"; term: AbstractSearchTerm }
  | { kind: "and"; children: SearchExpression[] }
  | { kind: "or"; children: SearchExpression[] }
  | { kind: "not"; child: SearchExpression };

export class SearchExpression {
  private constructor(public readonly node: Node) { }

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
}
