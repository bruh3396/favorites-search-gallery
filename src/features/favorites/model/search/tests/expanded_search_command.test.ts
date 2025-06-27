import { Fruit, INDEX } from "./search_test_utils";
import { describe, expect, test } from "vitest";
import { ExpandedSearchCommand } from "../search_command/expanded_search_command";
import { SearchTag } from "../search_tags/search_tag";

function getRawTagValue(searchTag: SearchTag): string {
  return searchTag.negated ? `-${searchTag.value}` : searchTag.value;
}

function getRawTagGroup(searchTags: SearchTag[]): string[] {
  return searchTags.map(tag => getRawTagValue(tag)).sort();
}

function getFinalSearchQuery(command: ExpandedSearchCommand<Fruit>): string {
  const remainingTags = getRawTagGroup(command.remainingTags).sort().join(" ");
  const orGroups = command.orGroups.map(orGroup => `( ${getRawTagGroup(orGroup).join(" ~ ")} )`).sort().join(" ");
  return `${remainingTags} ${orGroups}`.trim();
}

function testExpandWildcardTags(searchQuery: string, expectedQuery: string): ExpandedSearchCommand<Fruit> {
  const expandedCommand = new ExpandedSearchCommand<Fruit>(searchQuery, INDEX.allTags);
  const expectedCommand = new ExpandedSearchCommand<Fruit>(expectedQuery, INDEX.allTags);

  expect(getFinalSearchQuery(expandedCommand)).toStrictEqual(getFinalSearchQuery(expectedCommand));
  return expandedCommand;
}

describe("expandWildcardTags", () => {
  test("empty", () => {
    testExpandWildcardTags("", "");
    testExpandWildcardTags(" ", "");
    testExpandWildcardTags(" \n\t", "");
  });

  test("no wildcard tags", () => {
    testExpandWildcardTags("apple", "apple");
  });

  test("no matches from expanding remaining tags", () => {
    expect(testExpandWildcardTags("foobar", "foobar").hasNoMatches).toBe(false);
    expect(testExpandWildcardTags("foobar*", "").hasNoMatches).toBe(true);
    expect(testExpandWildcardTags("foobar* ap*", "").hasNoMatches).toBe(true);
  });

  test("one wildcard tag expands to multiple", () => {
    testExpandWildcardTags("sm*", "( small ~  smooth ~ smoothie )");
    testExpandWildcardTags("smo*", "( smooth ~ smoothie )");
    testExpandWildcardTags("*moo*", "( smooth ~ smoothie )");
    testExpandWildcardTags("*ee*", "( green ~ sweet ~ peelable ~ seedless )");
  });

  test("one wildcard tag expands to one", () => {
    testExpandWildcardTags("or*", "orange");
  });

  test("two wildcard tags", () => {
    testExpandWildcardTags("sm* smo*", "( small ~ smooth ~ smoothie ) ( smooth ~ smoothie )");
  });

  test("three wildcard tags", () => {
    testExpandWildcardTags("sm* bl* *ee*", "( small ~ smooth ~ smoothie ) ( blue ~ blueberry )  ( green ~ sweet ~ peelable ~ seedless )");
  });

  test("mixed tags", () => {
    testExpandWildcardTags("kiwi orange", "kiwi orange");
    testExpandWildcardTags("kiwi orange* banana", "kiwi orange banana");
  });

  test("or groups no expansion", () => {
    testExpandWildcardTags("kiwi orange* banana* ( red ~ blue )", "kiwi orange banana ( red ~ blue )");
    testExpandWildcardTags("kiwi orange* banana* ( red ~ blue ) ( apple ~ cherry )", "kiwi orange banana ( red ~ blue ) ( apple ~ cherry )");
  });

  test("expand or group", () => {
    testExpandWildcardTags("( *ta* ~ smo* )", "( tart ~ vitamin-c ~ vitamin-a ~ potassium ~ smoothie ~ smooth )");
    testExpandWildcardTags("( *ta* ~ smo* ) ( *ee* ~ smo* )", "( tart ~ vitamin-c ~ vitamin-a ~ potassium ~ smoothie ~ smooth ) ( green ~ sweet ~ peelable ~ seedless ~ smooth ~ smoothie )");
    testExpandWildcardTags("( *ta* ~ one ) ( smo* )", "( tart ~ vitamin-c ~ vitamin-a ~ potassium ~ one ) ( smooth ~ smoothie )");
    testExpandWildcardTags("( *ta* ~ one ~ two ) ( smo* )", "( tart ~ vitamin-c ~ vitamin-a ~ potassium ~ one ~ two ) ( smooth ~ smoothie )");
  });

  test("unmatchable or group", () => {
    expect(testExpandWildcardTags("( *foobar* ) ( smo* )", "").hasNoMatches).toBe(true);
    expect(testExpandWildcardTags("( *foobar* ~ foobar ) ( smo* )", "foobar ( smooth ~ smoothie )").hasNoMatches).toBe(false);
    expect(testExpandWildcardTags("( *foobar* ~ a* ) ( smo* )", "( apple ~ antioxidants ~ antioxidant ) ( smooth ~ smoothie )").hasNoMatches).toBe(false);
  });

  test("expand remaining and or groups", () => {
    testExpandWildcardTags("*ee* *ed *pple *ple ( tag ~ on* ~ smo* )", "( green ~ sweet ~ peelable ~ seedless ) red apple ( apple ~ purple ) ( tag ~ smooth ~ smoothie )");
    testExpandWildcardTags("*ee* *ed *pple *ple ( tag ~ on* ~ smo* ) ( red ~ blue )", "( green ~ sweet ~ peelable ~ seedless ) red apple ( apple ~ purple ) ( tag ~ smooth ~ smoothie ) ( red ~ blue )");
    testExpandWildcardTags("*ee* *ed *pple *ple ( tag ~ on* ~ smo* ) ( red ~ blue ) ( apple ~ *ch* )", "( green ~ sweet ~ peelable ~ seedless ) red apple ( apple ~ purple ) ( tag ~ smooth ~ smoothie ) ( red ~ blue ) ( apple ~ cherry ~ lunch ~ crunchy  )");
  });

  test("expand negated wildcard", () => {
    expect(testExpandWildcardTags("-*foobar*", "").hasNoMatches).toBe(false);
    testExpandWildcardTags("-*ee*", "-green -sweet -peelable -seedless");
  });
});
