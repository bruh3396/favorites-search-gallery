import { describe, expect, test } from "vitest";
import { FoundSearchTerm } from "@/core/domain/search/parsers/found_search_term";
import { findSearchTerm } from "@/core/domain/search/parsers/search_term_finder";

function findAtMarker(queryWithMarker: string): FoundSearchTerm | undefined {
  return findSearchTerm(queryWithMarker.replace("|", ""), queryWithMarker.indexOf("|"));
}

describe("findSearchTerm", () => {
  test("finds the term ending at the caret", () => {
    expect(findAtMarker("solo no|")).toEqual({ start: 5, end: 7, prefix: "no" });
  });

  test("finds a term in the middle of the query", () => {
    expect(findAtMarker("solo sc| blue_eyes")).toEqual({ start: 5, end: 7, prefix: "sc" });
  });

  test("spans the whole term while the prefix stops at the caret", () => {
    expect(findAtMarker("no|se")).toEqual({ start: 0, end: 4, prefix: "no" });
  });

  test("leaves the negation outside the term", () => {
    expect(findAtMarker("solo -no|se")).toEqual({ start: 6, end: 10, prefix: "no" });
  });

  test("treats a lone minus as the term", () => {
    expect(findAtMarker("-|")).toEqual({ start: 0, end: 1, prefix: "-" });
  });

  test("finds a term inside a group", () => {
    expect(findAtMarker("( cat ~ do| )")).toEqual({ start: 8, end: 10, prefix: "do" });
  });

  test("keeps a bracket attached to a word", () => {
    expect(findAtMarker("(do|")).toEqual({ start: 0, end: 3, prefix: "(do" });
  });

  test("keeps a metatag whole", () => {
    expect(findAtMarker("score:>1|0")).toEqual({ start: 0, end: 9, prefix: "score:>1" });
  });

  test("leaves a leading wildcard outside the term", () => {
    expect(findAtMarker("solo *no|se")).toEqual({ start: 6, end: 10, prefix: "no" });
  });

  test("leaves a negated leading wildcard outside the term", () => {
    expect(findAtMarker("-*no|")).toEqual({ start: 2, end: 4, prefix: "no" });
  });

  test("keeps later wildcards in the term", () => {
    expect(findAtMarker("*app|*")).toEqual({ start: 1, end: 5, prefix: "app" });
    expect(findAtMarker("cat|*")).toEqual({ start: 0, end: 4, prefix: "cat" });
  });

  test("returns group operators as terms", () => {
    expect(findAtMarker("(|")).toEqual({ start: 0, end: 1, prefix: "(" });
    expect(findAtMarker("-(|")).toEqual({ start: 1, end: 2, prefix: "(" });
    expect(findAtMarker("( cat ~|")).toEqual({ start: 6, end: 7, prefix: "~" });
  });

  test("separates terms on any whitespace", () => {
    expect(findAtMarker("solo\nno|")).toEqual({ start: 5, end: 7, prefix: "no" });
    expect(findAtMarker("solo   no|")).toEqual({ start: 7, end: 9, prefix: "no" });
  });

  test.each(["|", "|solo", "solo |", "solo | blue_eyes", "-|no", "*|", "*|no", "-*|"])("finds nothing typed at %j", queryWithMarker => {
    expect(findAtMarker(queryWithMarker)).toBeUndefined();
  });
});
