import { SearchExpression } from "@/core/search/expressions/search_expression";
import { SearchSettings } from "@/core/features/favorites/search/inputs";
import { parseExclusions } from "@/core/search/parsers/search_expression_parser";

export interface FavoritesBlacklistConfiguration {
  blacklistedTags: string;
  force: boolean;
}

export class FavoritesBlacklist {
  private readonly expression: SearchExpression | undefined;
  private readonly isForced: boolean;

  constructor({ blacklistedTags, force }: FavoritesBlacklistConfiguration) {
    this.expression = parseExclusions(blacklistedTags);
    this.isForced = force;
  }

  public apply(expression: SearchExpression, { isBlacklistEnabled }: Pick<SearchSettings, "isBlacklistEnabled">): SearchExpression {
    return (this.isForced || isBlacklistEnabled) && this.expression !== undefined ? SearchExpression.and([this.expression, expression]) : expression;
  }
}
