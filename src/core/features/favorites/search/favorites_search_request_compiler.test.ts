import { describe, expect, test } from "vitest";
import { parseExclusions, tryParseSearchExpression } from "@/core/domain/search/parsers/search_expression_parser";
import { FavoritesBlacklist } from "@/core/features/favorites/search/favorites_blacklist";
import { SearchExpression } from "@/core/domain/search/expressions/search_expression";
import { compileFavoritesSearchRequest } from "@/core/features/favorites/search/favorites_search_request_compiler";
import { buildFavoritesSearchSettings } from "@/core/features/favorites/testing/favorites_search_settings_builder";

const NO_BLACKLIST = new FavoritesBlacklist({ blacklistedTags: [], force: false });

describe("compileFavoritesSearchRequest", () => {
  test("copies the sort, rating, and shuffle settings", () => {
    const settings = buildFavoritesSearchSettings({ sortKey: "score", isSortAscending: true, allowedRatings: 1, isShuffled: true, shuffleSeed: 7 });

    expect(compileFavoritesSearchRequest(settings, NO_BLACKLIST))
      .toMatchObject({ sortKey: "score", isSortAscending: true, allowedRatings: 1, isShuffled: true, shuffleSeed: 7 });
  });

  test("parses the query into the expression", () => {
    expect(compileFavoritesSearchRequest(buildFavoritesSearchSettings({ query: "cat" }), NO_BLACKLIST).expression).toEqual(tryParseSearchExpression("cat"));
  });

  test("returns no expression for an invalid query", () => {
    expect(compileFavoritesSearchRequest(buildFavoritesSearchSettings({ query: "( cat" }), NO_BLACKLIST).expression).toBeUndefined();
  });

  test("negates the query when inverted", () => {
    const settings = buildFavoritesSearchSettings({ query: "cat", isInverted: true });

    expect(compileFavoritesSearchRequest(settings, NO_BLACKLIST).expression).toEqual(SearchExpression.not(tryParseSearchExpression("cat")!));
  });

  test("keeps the blacklist outside the inversion", () => {
    const blacklist = new FavoritesBlacklist({ blacklistedTags: ["apple"], force: true });
    const settings = buildFavoritesSearchSettings({ query: "cat", isInverted: true });

    expect(compileFavoritesSearchRequest(settings, blacklist).expression)
      .toEqual(SearchExpression.and([parseExclusions(["apple"])!, SearchExpression.not(tryParseSearchExpression("cat")!)]));
  });
});
