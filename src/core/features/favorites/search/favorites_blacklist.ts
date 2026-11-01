import { FavoritesSearchSettings } from "@/core/features/favorites/search/favorites_search_settings";
import { SearchExpression } from "@/core/domain/search/expressions/search_expression";
import { parseExactSearchTerm } from "@/core/domain/search/parsers/search_term_parser";

export interface FavoritesBlacklistConfiguration {
  readonly blacklistedTags: readonly string[];
  readonly force: boolean;
}

export class FavoritesBlacklist {
  private readonly searchExpression: SearchExpression | undefined;
  private readonly force: boolean;

  constructor({ blacklistedTags, force }: FavoritesBlacklistConfiguration) {
    this.searchExpression = buildExclusionSearchExpression(blacklistedTags);
    this.force = force;
  }

  public apply(searchExpression: SearchExpression, { isBlacklistEnabled }: Pick<FavoritesSearchSettings, "isBlacklistEnabled">): SearchExpression {
    return (this.force || isBlacklistEnabled) && this.searchExpression !== undefined ? SearchExpression.and([
      this.searchExpression,
      searchExpression
    ]) : searchExpression;
  }
}

function buildExclusionSearchExpression(tags: readonly string[]): SearchExpression | undefined {
  const exclusionSearchExpressions = tags.map(tag => SearchExpression.not(SearchExpression.term(parseExactSearchTerm(tag.toLowerCase()))));
  return exclusionSearchExpressions.length === 0 ? undefined : SearchExpression.and(exclusionSearchExpressions);
}
