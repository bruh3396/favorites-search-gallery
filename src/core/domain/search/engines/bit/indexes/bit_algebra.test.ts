import { DensePosting, SparsePosting } from "@/core/domain/search/engines/bit/postings/posting";
import { describe, expect, test } from "vitest";
import { BitAlgebra } from "@/core/domain/search/engines/bit/indexes/bit_algebra";
import { BitSet } from "@/core/domain/search/engines/bit/postings/bitset";
import { DocTable } from "@/core/domain/search/engines/bit/indexes/doc_table";

const DOCS = ["apple", "banana", "cherry"];

function setup(): BitAlgebra<string> {
  const table = new DocTable<string>();
  const algebra = new BitAlgebra(table);

  table.reset(DOCS.length, DOCS.length);
  algebra.reset();
  DOCS.forEach((doc, position) => {
    table.place(doc, position);
    algebra.occupy(position);
  });
  return algebra;
}

function createBitSet(...positions: number[]): BitSet {
  const bitSet = new BitSet(64);

  positions.forEach(position => bitSet.set(position));
  return bitSet;
}

describe("BitAlgebra", () => {
  describe("universe", () => {
    test("holds every occupied position", () => {
      const algebra = setup();

      expect(algebra.docsFrom(algebra.universe())).toEqual(DOCS);
    });

    test("returns a copy the caller may change", () => {
      const algebra = setup();

      algebra.universe().clear(0);
      expect(algebra.docsFrom(algebra.universe())).toEqual(DOCS);
    });
  });

  describe("empty", () => {
    test("holds nothing at the table's width", () => {
      const empty = setup().empty();

      expect(empty.size).toBe(64);
      expect(empty.isEmpty()).toBe(true);
    });
  });

  describe("reset", () => {
    test("vacates every position", () => {
      const algebra = setup();

      algebra.reset();
      expect(algebra.universe().isEmpty()).toBe(true);
    });
  });

  describe("bitSetFrom", () => {
    test("expands a sparse posting to the table's width", () => {
      const algebra = setup();

      expect(algebra.docsFrom(algebra.bitSetFrom(new SparsePosting(Uint8Array.of(0, 2))))).toEqual(["apple", "cherry"]);
    });
  });

  describe("complementOf", () => {
    test("holds the occupied positions outside the set", () => {
      const algebra = setup();

      expect(algebra.docsFrom(algebra.complementOf(createBitSet(1)))).toEqual(["apple", "cherry"]);
    });
  });

  describe("unionOf", () => {
    test("holds the positions of any posting", () => {
      const algebra = setup();
      const union = algebra.unionOf([new SparsePosting(Uint8Array.of(0)), new DensePosting(createBitSet(2))]);

      expect(algebra.docsFrom(union)).toEqual(["apple", "cherry"]);
    });

    test("holds nothing for no postings", () => {
      expect(setup().unionOf([]).isEmpty()).toBe(true);
    });
  });
});
