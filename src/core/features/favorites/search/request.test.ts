import { describe, expect, test } from "vitest";
import { parseExclusions, tryParseSearchExpression } from "@/core/domain/search/parsers/search_expression_parser";
import { FavoritesBlacklist } from "@/core/features/favorites/search/blacklist";
import { SearchExpression } from "@/core/domain/search/expressions/search_expression";
import { buildSearchRequest } from "@/core/features/favorites/search/request";
import { createSearchSettings } from "@/core/features/favorites/testing/search";

const NO_BLACKLIST = new FavoritesBlacklist({ blacklistedTags: [], force: false });

describe("buildSearchRequest", () => {
  test("copies the sort, rating, and shuffle settings", () => {
    const settings = createSearchSettings({ sortKey: "score", isSortAscending: true, allowedRatings: 1, isShuffled: true, shuffleSeed: 7 });

    expect(buildSearchRequest(settings, NO_BLACKLIST))
      .toMatchObject({ sortKey: "score", isSortAscending: true, allowedRatings: 1, isShuffled: true, shuffleSeed: 7 });
  });

  test("parses the query into the expression", () => {
    expect(buildSearchRequest(createSearchSettings({ query: "cat" }), NO_BLACKLIST).expression).toEqual(tryParseSearchExpression("cat"));
  });

  test("returns no expression for an invalid query", () => {
    expect(buildSearchRequest(createSearchSettings({ query: "( cat" }), NO_BLACKLIST).expression).toBeUndefined();
  });

  test("negates the query when inverted", () => {
    const settings = createSearchSettings({ query: "cat", isInverted: true });

    expect(buildSearchRequest(settings, NO_BLACKLIST).expression).toEqual(SearchExpression.not(tryParseSearchExpression("cat")!));
  });

  test("keeps the blacklist outside the inversion", () => {
    const blacklist = new FavoritesBlacklist({ blacklistedTags: ["apple"], force: true });
    const settings = createSearchSettings({ query: "cat", isInverted: true });

    expect(buildSearchRequest(settings, blacklist).expression)
      .toEqual(SearchExpression.and([parseExclusions(["apple"])!, SearchExpression.not(tryParseSearchExpression("cat")!)]));
  });
});
