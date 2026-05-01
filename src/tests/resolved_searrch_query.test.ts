import { Fruit, INDEX } from "./search_test_utils";
import { describe, expect, test } from "vitest";
import { AbstractSearchTag } from "../lib/search/tag/abstract_search_tag";
import { ResolvedSearchQuery } from "../lib/search/query/resolved_search_query";

function getRawTagValue(searchTag: AbstractSearchTag): string {
  return searchTag.negated ? `-${searchTag.value}` : searchTag.value;
}

function getRawTagGroup(searchTags: AbstractSearchTag[]): string[] {
  return searchTags.map(tag => getRawTagValue(tag)).sort();
}

function getFinalSearchQuery(resolvedQuery: ResolvedSearchQuery<Fruit>): string {
  const andTags = getRawTagGroup(resolvedQuery.andTags).sort().join(" ");
  const orGroups = resolvedQuery.orGroups.map(orGroup => `( ${getRawTagGroup(orGroup).join(" ~ ")} )`).sort().join(" ");
  return `${andTags} ${orGroups}`.trim();
}

function testResolveSearchQuery(rawQuery: string, expectedRawQuery: string): ResolvedSearchQuery<Fruit> {
  const resolvedQuery = new ResolvedSearchQuery<Fruit>(rawQuery, INDEX.getIndexedTerms());
  const expectedQuery = new ResolvedSearchQuery<Fruit>(expectedRawQuery, INDEX.getIndexedTerms());

  expect(getFinalSearchQuery(resolvedQuery)).toStrictEqual(getFinalSearchQuery(expectedQuery));
  return resolvedQuery;
}

describe("resolveWildcardTags", () => {
  test("empty", () => {
    testResolveSearchQuery("", "");
    testResolveSearchQuery(" ", "");
    testResolveSearchQuery(" \n\t", "");
  });

  test("no wildcard tags", () => {
    testResolveSearchQuery("apple", "apple");
  });

  test("no matches from resolving and wildcard tags", () => {
    expect(testResolveSearchQuery("foobar", "foobar").isUnmatchable).toBe(false);
    expect(testResolveSearchQuery("foobar*", "").isUnmatchable).toBe(true);
    expect(testResolveSearchQuery("foobar* ap*", "").isUnmatchable).toBe(true);
  });

  test("one wildcard tag resolves to multiple", () => {
    testResolveSearchQuery("sm*", "( small ~  smooth ~ smoothie )");
    testResolveSearchQuery("smo*", "( smooth ~ smoothie )");
    testResolveSearchQuery("*moo*", "( smooth ~ smoothie )");
    testResolveSearchQuery("*ee*", "( green ~ sweet ~ peelable ~ seedless )");
  });

  test("one wildcard tag resolves to one", () => {
    testResolveSearchQuery("or*", "orange");
  });

  test("two wildcard tags", () => {
    testResolveSearchQuery("sm* smo*", "( small ~ smooth ~ smoothie ) ( smooth ~ smoothie )");
  });

  test("three wildcard tags", () => {
    testResolveSearchQuery("sm* bl* *ee*", "( small ~ smooth ~ smoothie ) ( blue ~ blueberry )  ( green ~ sweet ~ peelable ~ seedless )");
  });

  test("mixed tags", () => {
    testResolveSearchQuery("kiwi orange", "kiwi orange");
    testResolveSearchQuery("kiwi orange* banana", "kiwi orange banana");
  });

  test("or groups no expansion", () => {
    testResolveSearchQuery("kiwi orange* banana* ( red ~ blue )", "kiwi orange banana ( red ~ blue )");
    testResolveSearchQuery("kiwi orange* banana* ( red ~ blue ) ( apple ~ cherry )", "kiwi orange banana ( red ~ blue ) ( apple ~ cherry )");
  });

  test("resolve or group", () => {
    testResolveSearchQuery("( *ta* ~ smo* )", "( tart ~ vitamin-c ~ vitamin-a ~ potassium ~ smoothie ~ smooth )");
    testResolveSearchQuery("( *ta* ~ smo* ) ( *ee* ~ smo* )", "( tart ~ vitamin-c ~ vitamin-a ~ potassium ~ smoothie ~ smooth ) ( green ~ sweet ~ peelable ~ seedless ~ smooth ~ smoothie )");
    testResolveSearchQuery("( *ta* ~ one ) ( smo* )", "( tart ~ vitamin-c ~ vitamin-a ~ potassium ~ one ) ( smooth ~ smoothie )");
    testResolveSearchQuery("( *ta* ~ one ~ two ) ( smo* )", "( tart ~ vitamin-c ~ vitamin-a ~ potassium ~ one ~ two ) ( smooth ~ smoothie )");
  });

  test("unmatchable or group", () => {
    expect(testResolveSearchQuery("( *foobar* ) ( smo* )", "").isUnmatchable).toBe(true);
    expect(testResolveSearchQuery("( *foobar* ~ foobar ) ( smo* )", "foobar ( smooth ~ smoothie )").isUnmatchable).toBe(false);
    expect(testResolveSearchQuery("( *foobar* ~ a* ) ( smo* )", "( apple ~ antioxidants ~ antioxidant ) ( smooth ~ smoothie )").isUnmatchable).toBe(false);
  });

  test("resolve and tags and or groups", () => {
    testResolveSearchQuery("*ee* *ed *pple *ple ( tag ~ on* ~ smo* )", "( green ~ sweet ~ peelable ~ seedless ) red apple ( apple ~ purple ) ( tag ~ smooth ~ smoothie )");
    testResolveSearchQuery("*ee* *ed *pple *ple ( tag ~ on* ~ smo* ) ( red ~ blue )", "( green ~ sweet ~ peelable ~ seedless ) red apple ( apple ~ purple ) ( tag ~ smooth ~ smoothie ) ( red ~ blue )");
    testResolveSearchQuery("*ee* *ed *pple *ple ( tag ~ on* ~ smo* ) ( red ~ blue ) ( apple ~ *ch* )", "( green ~ sweet ~ peelable ~ seedless ) red apple ( apple ~ purple ) ( tag ~ smooth ~ smoothie ) ( red ~ blue ) ( apple ~ cherry ~ lunch ~ crunchy  )");
  });

  test("resolve negated wildcard", () => {
    expect(testResolveSearchQuery("-*foobar*", "").isUnmatchable).toBe(false);
    testResolveSearchQuery("-*ee*", "-green -sweet -peelable -seedless");
  });
});
