import { describe, expect, test } from "vitest";
import { parseExclusions, tryParseSearchExpression } from "@/core/search/parsers/search_expression_parser";
import { FavoritesBlacklist } from "@/core/features/favorites/search/blacklist";
import { SearchExpression } from "@/core/search/expressions/search_expression";

const MATCHES = tryParseSearchExpression("cat")!;
const EXCLUSIONS = parseExclusions("apple banana")!;

describe("FavoritesBlacklist", () => {
  test.each([
    { isForced: false, isBlacklistEnabled: true },
    { isForced: true, isBlacklistEnabled: false },
    { isForced: true, isBlacklistEnabled: true }
  ])("excludes the blacklisted tags when forced is $isForced and enabled is $isBlacklistEnabled", ({ isForced, isBlacklistEnabled }) => {
    const blacklist = new FavoritesBlacklist({ blacklistedTags: "apple banana", force: isForced });

    expect(blacklist.apply(MATCHES, { isBlacklistEnabled })).toEqual(SearchExpression.and([EXCLUSIONS, MATCHES]));
  });

  test("leaves the matches alone while disabled and not forced", () => {
    const blacklist = new FavoritesBlacklist({ blacklistedTags: "apple banana", force: false });

    expect(blacklist.apply(MATCHES, { isBlacklistEnabled: false })).toBe(MATCHES);
  });

  test("leaves the matches alone when nothing is blacklisted", () => {
    const blacklist = new FavoritesBlacklist({ blacklistedTags: "", force: true });

    expect(blacklist.apply(MATCHES, { isBlacklistEnabled: true })).toBe(MATCHES);
  });
});
