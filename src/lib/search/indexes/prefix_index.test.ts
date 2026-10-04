import { describe, expect, test } from "vitest";
import { PrefixIndex } from "@/lib/search/indexes/prefix_index";
import { SortedArray } from "@/lib/collection/sorted_array";
import { compareStrings } from "@/utils/pure/string";

const terms = ["ana", "banana", "band", "bandana", "brand", "cabana", "canvas", "sandbox"].slice().sort();

function createIndex(): PrefixIndex {
  return new PrefixIndex(new SortedArray<string>((a, b) => compareStrings(a, b), terms));
}

describe("PrefixIndex", () => {
  test("finds the contiguous run of terms sharing the prefix", () => {
    expect(createIndex().termsMatchingPrefix("ban")).toEqual(["banana", "band", "bandana"]);
  });

  test("matches a single term", () => {
    expect(createIndex().termsMatchingPrefix("can")).toEqual(["canvas"]);
  });

  test("matches a term equal to the prefix", () => {
    expect(createIndex().termsMatchingPrefix("band")).toEqual(["band", "bandana"]);
  });

  test("returns nothing for a prefix that sorts between terms without matching", () => {
    expect(createIndex().termsMatchingPrefix("bb")).toEqual([]);
  });

  test("returns nothing for a prefix after every term", () => {
    expect(createIndex().termsMatchingPrefix("zzz")).toEqual([]);
  });

  test("returns every term for an empty prefix", () => {
    expect(createIndex().termsMatchingPrefix("")).toEqual(terms);
  });

  test("returns nothing from an empty index", () => {
    expect(new PrefixIndex(new SortedArray()).termsMatchingPrefix("ban")).toEqual([]);
  });
});
