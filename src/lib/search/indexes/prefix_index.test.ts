import { describe, expect, test } from "vitest";
import { PrefixIndex } from "@/lib/search/indexes/prefix_index";

const terms = ["ana", "banana", "band", "bandana", "brand", "cabana", "canvas", "sandbox"].slice().sort();

describe("PrefixIndex", () => {
  const index = new PrefixIndex(terms);

  test("finds the contiguous run of terms sharing the prefix", () => {
    expect(index.matchingPrefix("ban")).toEqual(["banana", "band", "bandana"]);
  });

  test("matches a single term", () => {
    expect(index.matchingPrefix("can")).toEqual(["canvas"]);
  });

  test("matches a term equal to the prefix", () => {
    expect(index.matchingPrefix("band")).toEqual(["band", "bandana"]);
  });

  test("returns nothing for a prefix that sorts between terms without matching", () => {
    expect(index.matchingPrefix("bb")).toEqual([]);
  });

  test("returns nothing for a prefix after every term", () => {
    expect(index.matchingPrefix("zzz")).toEqual([]);
  });

  test("empty prefix returns every term", () => {
    expect(index.matchingPrefix("")).toEqual(terms);
  });

  test("empty index returns nothing", () => {
    expect(new PrefixIndex([]).matchingPrefix("ban")).toEqual([]);
  });
});

describe("PrefixIndex mutation", () => {
  test("addTerm keeps the run sorted and findable", () => {
    const index = new PrefixIndex(terms);

    index.add("banjo");
    expect(index.matchingPrefix("ban")).toEqual(["banana", "band", "bandana", "banjo"]);
  });

  test("removeTerm drops the term from its prefix run", () => {
    const index = new PrefixIndex(terms);

    index.remove("band");
    expect(index.matchingPrefix("ban")).toEqual(["banana", "bandana"]);
  });

  test("allTerms returns the sorted corpus", () => {
    const index = new PrefixIndex(terms);

    index.add("banjo");
    expect(index.all()).toEqual([...terms, "banjo"].slice().sort());
  });
});
