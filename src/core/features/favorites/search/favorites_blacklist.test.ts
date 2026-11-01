import { describe, expect, test } from "vitest";
import { FavoritesBlacklist } from "@/core/features/favorites/search/favorites_blacklist";
import { SearchExpression } from "@/core/domain/search/expressions/search_expression";
import { parseExactSearchTerm } from "@/core/domain/search/parsers/search_term_parser";
import { parseSearchExpression } from "@/core/domain/search/parsers/search_expression_parser";

const MATCHES = parseSearchExpression("cat");

function exclude(...tags: string[]): SearchExpression {
  return SearchExpression.and(tags.map(tag => SearchExpression.not(SearchExpression.term(parseExactSearchTerm(tag)))));
}

describe("FavoritesBlacklist", () => {
  test.each([
    { isForced: false, isBlacklistEnabled: true },
    { isForced: true, isBlacklistEnabled: false },
    { isForced: true, isBlacklistEnabled: true }
  ])("excludes the blacklisted tags when forced is $isForced and enabled is $isBlacklistEnabled", ({ isForced, isBlacklistEnabled }) => {
    const favoritesBlacklist = new FavoritesBlacklist({ blacklistedTags: ["apple", "banana"], force: isForced });

    expect(favoritesBlacklist.apply(MATCHES, { isBlacklistEnabled })).toEqual(SearchExpression.and([exclude("apple", "banana"), MATCHES]));
  });

  test("excludes a tag literally and lowercased instead of parsing it as syntax", () => {
    const favoritesBlacklist = new FavoritesBlacklist({ blacklistedTags: ["APPLE*"], force: true });

    expect(favoritesBlacklist.apply(MATCHES, { isBlacklistEnabled: true })).toEqual(SearchExpression.and([exclude("apple*"), MATCHES]));
  });

  test("leaves the matches alone while disabled and not forced", () => {
    const favoritesBlacklist = new FavoritesBlacklist({ blacklistedTags: ["apple", "banana"], force: false });

    expect(favoritesBlacklist.apply(MATCHES, { isBlacklistEnabled: false })).toBe(MATCHES);
  });

  test("leaves the matches alone when nothing is blacklisted", () => {
    const favoritesBlacklist = new FavoritesBlacklist({ blacklistedTags: [], force: true });

    expect(favoritesBlacklist.apply(MATCHES, { isBlacklistEnabled: true })).toBe(MATCHES);
  });
});
