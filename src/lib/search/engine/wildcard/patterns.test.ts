import { describe, expect, test } from "vitest";
import { multiStarWildcard, prefixWildcard, substringWildcard, suffixWildcard } from "@/lib/search/engine/wildcard/patterns";

interface Match {
  full: string;
  groups: string[];
}

function matches(pattern: RegExp, query: string): Match[] {
  pattern.lastIndex = 0;
  return [...query.matchAll(pattern)].map(match => ({ full: match[0], groups: match.slice(1).map(group => group ?? "") }));
}

describe("prefixWildcard", () => {
  test("captures negation and fragment", () => {
    expect(matches(prefixWildcard, "cat*")).toEqual([{ full: "cat*", groups: ["", "cat"] }]);
    expect(matches(prefixWildcard, "-cat*")).toEqual([{ full: "-cat*", groups: ["-", "cat"] }]);
  });

  test("does not match a mid-token asterisk", () => {
    expect(matches(prefixWildcard, "a*b")).toEqual([]);
  });

  test("matches inside an or group", () => {
    expect(matches(prefixWildcard, "( cat* ~ dog* )").map(match => match.full)).toEqual(["cat*", "dog*"]);
  });
});

describe("substringWildcard", () => {
  test("captures the inner fragment", () => {
    expect(matches(substringWildcard, "*cat*")).toEqual([{ full: "*cat*", groups: ["", "cat"] }]);
    expect(matches(substringWildcard, "-*cat*")).toEqual([{ full: "-*cat*", groups: ["-", "cat"] }]);
  });
});

describe("suffixWildcard", () => {
  test("captures the trailing fragment", () => {
    expect(matches(suffixWildcard, "*cat")).toEqual([{ full: "*cat", groups: ["", "cat"] }]);
    expect(matches(suffixWildcard, "-*cat")).toEqual([{ full: "-*cat", groups: ["-", "cat"] }]);
  });
});

describe("multiStarWildcard", () => {
  test("captures negation, leading star, body and trailing star", () => {
    expect(matches(multiStarWildcard, "*a*b*")).toEqual([{ full: "*a*b*", groups: ["", "*", "a*b", "*"] }]);
    expect(matches(multiStarWildcard, "a*b")).toEqual([{ full: "a*b", groups: ["", "", "a*b", ""] }]);
  });

  test("keeps a leading negation out of the body", () => {
    expect(matches(multiStarWildcard, "-*a*b*")).toEqual([{ full: "-*a*b*", groups: ["-", "*", "a*b", "*"] }]);
  });

  test("does not swallow a leading hyphen into the body", () => {
    const body = matches(multiStarWildcard, "-*contains*")[0];

    expect(body).toBeUndefined();
  });
});
