import { Fruit, index } from "./fruit_search_fixtures";
import { describe, expect, test } from "vitest";
import { AbstractSearchTerm } from "../../lib/search/terms/abstract_search_term";
import { ExpandedSearchQuery } from "../../lib/search/query/expanded_search_query";

function getRawTagValue(searchTag: AbstractSearchTerm): string {
  return searchTag.negated ? `-${searchTag.value}` : searchTag.value;
}

function getRawTagGroup(searchTags: AbstractSearchTerm[]): string[] {
  return searchTags.map(tag => getRawTagValue(tag)).sort();
}

function getFinalSearchQuery(expandedQuery: ExpandedSearchQuery<Fruit>): string {
  const andTags = getRawTagGroup(expandedQuery.andTerms).sort().join(" ");
  const orGroups = expandedQuery.orGroups.map(orGroup => `( ${getRawTagGroup(orGroup).join(" ~ ")} )`).sort().join(" ");
  return `${andTags} ${orGroups}`.trim();
}

function testExpandSearchQuery(rawQuery: string, expectedRawQuery: string): ExpandedSearchQuery<Fruit> {
  const expandedQuery = new ExpandedSearchQuery<Fruit>(rawQuery, index.indexedTerms());
  const expectedQuery = new ExpandedSearchQuery<Fruit>(expectedRawQuery, index.indexedTerms());

  expect(getFinalSearchQuery(expandedQuery)).toStrictEqual(getFinalSearchQuery(expectedQuery));
  return expandedQuery;
}

describe("expandWildcardTags", () => {
  test("empty", () => {
    testExpandSearchQuery("", "");
    testExpandSearchQuery(" ", "");
    testExpandSearchQuery(" \n\t", "");
  });

  test("no wildcard tags", () => {
    testExpandSearchQuery("apple", "apple");
  });

  test("no matches from resolving and wildcard tags", () => {
    expect(testExpandSearchQuery("foobar", "foobar").isUnmatchable).toBe(false);
    expect(testExpandSearchQuery("foobar*", "").isUnmatchable).toBe(true);
    expect(testExpandSearchQuery("foobar* ap*", "").isUnmatchable).toBe(true);
  });

  test("one wildcard tag expands to multiple", () => {
    testExpandSearchQuery("sm*", "( small ~  smooth ~ smoothie )");
    testExpandSearchQuery("smo*", "( smooth ~ smoothie )");
    testExpandSearchQuery("*moo*", "( smooth ~ smoothie )");
    testExpandSearchQuery("*ee*", "( green ~ sweet ~ peelable ~ seedless )");
  });

  test("one wildcard tag expands to one", () => {
    testExpandSearchQuery("or*", "orange");
  });

  test("two wildcard tags", () => {
    testExpandSearchQuery("sm* smo*", "( small ~ smooth ~ smoothie ) ( smooth ~ smoothie )");
  });

  test("three wildcard tags", () => {
    testExpandSearchQuery("sm* bl* *ee*", "( small ~ smooth ~ smoothie ) ( blue ~ blueberry )  ( green ~ sweet ~ peelable ~ seedless )");
  });

  test("mixed tags", () => {
    testExpandSearchQuery("kiwi orange", "kiwi orange");
    testExpandSearchQuery("kiwi orange* banana", "kiwi orange banana");
  });

  test("or groups no expansion", () => {
    testExpandSearchQuery("kiwi orange* banana* ( red ~ blue )", "kiwi orange banana ( red ~ blue )");
    testExpandSearchQuery("kiwi orange* banana* ( red ~ blue ) ( apple ~ cherry )", "kiwi orange banana ( red ~ blue ) ( apple ~ cherry )");
  });

  test("expand or group", () => {
    testExpandSearchQuery("( *ta* ~ smo* )", "( tart ~ vitamin-c ~ vitamin-a ~ potassium ~ smoothie ~ smooth )");
    testExpandSearchQuery("( *ta* ~ smo* ) ( *ee* ~ smo* )", "( tart ~ vitamin-c ~ vitamin-a ~ potassium ~ smoothie ~ smooth ) ( green ~ sweet ~ peelable ~ seedless ~ smooth ~ smoothie )");
    testExpandSearchQuery("( *ta* ~ one ) ( smo* )", "( tart ~ vitamin-c ~ vitamin-a ~ potassium ~ one ) ( smooth ~ smoothie )");
    testExpandSearchQuery("( *ta* ~ one ~ two ) ( smo* )", "( tart ~ vitamin-c ~ vitamin-a ~ potassium ~ one ~ two ) ( smooth ~ smoothie )");
  });

  test("unmatchable or group", () => {
    expect(testExpandSearchQuery("( *foobar* ) ( smo* )", "").isUnmatchable).toBe(true);
    expect(testExpandSearchQuery("( *foobar* ~ foobar ) ( smo* )", "foobar ( smooth ~ smoothie )").isUnmatchable).toBe(false);
    expect(testExpandSearchQuery("( *foobar* ~ a* ) ( smo* )", "( apple ~ antioxidants ~ antioxidant ) ( smooth ~ smoothie )").isUnmatchable).toBe(false);
  });

  test("expand and tags and or groups", () => {
    testExpandSearchQuery("*ee* *ed *pple *ple ( tag ~ on* ~ smo* )", "( green ~ sweet ~ peelable ~ seedless ) red apple ( apple ~ purple ) ( tag ~ smooth ~ smoothie )");
    testExpandSearchQuery("*ee* *ed *pple *ple ( tag ~ on* ~ smo* ) ( red ~ blue )", "( green ~ sweet ~ peelable ~ seedless ) red apple ( apple ~ purple ) ( tag ~ smooth ~ smoothie ) ( red ~ blue )");
    testExpandSearchQuery("*ee* *ed *pple *ple ( tag ~ on* ~ smo* ) ( red ~ blue ) ( apple ~ *ch* )", "( green ~ sweet ~ peelable ~ seedless ) red apple ( apple ~ purple ) ( tag ~ smooth ~ smoothie ) ( red ~ blue ) ( apple ~ cherry ~ lunch ~ crunchy  )");
  });

  test("expand negated wildcard", () => {
    expect(testExpandSearchQuery("-*foobar*", "").isUnmatchable).toBe(false);
    testExpandSearchQuery("-*ee*", "-green -sweet -peelable -seedless");
  });
});
