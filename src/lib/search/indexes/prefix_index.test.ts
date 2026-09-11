import { describe, expect, test } from "vitest";
import { PrefixIndex } from "@/lib/search/indexes/prefix_index";
import { SortedArray } from "@/lib/collection/sorted_array";
import { compareStrings } from "@/utils/pure/string";

const terms = ["ana", "banana", "band", "bandana", "brand", "cabana", "canvas", "sandbox"].slice().sort();

describe("PrefixIndex", () => {
  const index = new PrefixIndex(new SortedArray<string>((a, b) => compareStrings(a, b), terms));

  test("finds the contiguous run of terms sharing the prefix", () => {
    expect(index.termsMatchingPrefix("ban")).toEqual(["banana", "band", "bandana"]);
  });

  test("matches a single term", () => {
    expect(index.termsMatchingPrefix("can")).toEqual(["canvas"]);
  });

  test("matches a term equal to the prefix", () => {
    expect(index.termsMatchingPrefix("band")).toEqual(["band", "bandana"]);
  });

  test("returns nothing for a prefix that sorts between terms without matching", () => {
    expect(index.termsMatchingPrefix("bb")).toEqual([]);
  });

  test("returns nothing for a prefix after every term", () => {
    expect(index.termsMatchingPrefix("zzz")).toEqual([]);
  });

  test("empty prefix returns every term", () => {
    expect(index.termsMatchingPrefix("")).toEqual(terms);
  });

  test("empty index returns nothing", () => {
    expect(new PrefixIndex(new SortedArray()).termsMatchingPrefix("ban")).toEqual([]);
  });
});
