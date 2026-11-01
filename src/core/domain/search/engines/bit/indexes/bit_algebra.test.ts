import { DensePosting, SparsePosting } from "@/core/domain/search/engines/bit/posting/posting";
import { describe, expect, test } from "vitest";
import { BitAlgebra } from "@/core/domain/search/engines/bit/indexes/bit_algebra";
import { BitSet } from "@/core/domain/search/engines/bit/posting/bitset";
import { DocTable } from "@/core/domain/search/engines/bit/indexes/doc_table";

const DOCS = ["apple", "banana", "cherry"];

function setup(): BitAlgebra<string> {
  const docTable = new DocTable<string>();
  const bitAlgebra = new BitAlgebra(docTable);

  docTable.reset(DOCS.length, DOCS.length);
  bitAlgebra.reset();
  DOCS.forEach((doc, position) => {
    docTable.place(doc, position);
    bitAlgebra.occupy(position);
  });
  return bitAlgebra;
}

function createBitSet(...positions: number[]): BitSet {
  const bitSet = new BitSet(64);

  positions.forEach(position => bitSet.set(position));
  return bitSet;
}

describe("BitAlgebra", () => {
  describe("universe", () => {
    test("holds every occupied position", () => {
      const bitAlgebra = setup();

      expect(bitAlgebra.docsFrom(bitAlgebra.universe())).toEqual(DOCS);
    });

    test("returns a copy the caller may change", () => {
      const bitAlgebra = setup();

      bitAlgebra.universe().clear(0);
      expect(bitAlgebra.docsFrom(bitAlgebra.universe())).toEqual(DOCS);
    });
  });

  describe("empty", () => {
    test("holds nothing at the table's width", () => {
      const emptyBitSet = setup().empty();

      expect(emptyBitSet.size).toBe(64);
      expect(emptyBitSet.isEmpty()).toBe(true);
    });
  });

  describe("reset", () => {
    test("vacates every position", () => {
      const bitAlgebra = setup();

      bitAlgebra.reset();
      expect(bitAlgebra.universe().isEmpty()).toBe(true);
    });
  });

  describe("bitSetFrom", () => {
    test("expands a sparse posting to the table's width", () => {
      const bitAlgebra = setup();

      expect(bitAlgebra.docsFrom(bitAlgebra.bitSetFrom(new SparsePosting(Uint8Array.of(0, 2))))).toEqual(["apple", "cherry"]);
    });
  });

  describe("complementOf", () => {
    test("holds the occupied positions outside the set", () => {
      const bitAlgebra = setup();

      expect(bitAlgebra.docsFrom(bitAlgebra.complementOf(createBitSet(1)))).toEqual(["apple", "cherry"]);
    });
  });

  describe("unionOf", () => {
    test("holds the positions of any posting", () => {
      const bitAlgebra = setup();
      const unionBitSet = bitAlgebra.unionOf([new SparsePosting(Uint8Array.of(0)), new DensePosting(createBitSet(2))]);

      expect(bitAlgebra.docsFrom(unionBitSet)).toEqual(["apple", "cherry"]);
    });

    test("holds nothing for no postings", () => {
      expect(setup().unionOf([]).isEmpty()).toBe(true);
    });
  });
});
