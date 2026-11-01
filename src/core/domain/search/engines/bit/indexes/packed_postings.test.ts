import { describe, expect, test } from "vitest";
import { PackedPostings } from "@/core/domain/search/engines/bit/indexes/packed_postings";

const anySparse = (): boolean => true;

function createPackedPostings(entries: Record<string, number[]>, isSparse: (length: number) => boolean = anySparse): PackedPostings {
  const packedPostings = new PackedPostings();
  const sparseTerms: [string, number[]][] = [];
  let total = 0;
  let max = 0;

  for (const [term, positions] of Object.entries(entries)) {
    if (isSparse(positions.length)) {
      sparseTerms.push([term, positions]);
      total += positions.length;
      max = Math.max(max, ...positions);
    }
  }
  packedPostings.pack(sparseTerms, total, max);
  return packedPostings;
}

function sliceArray(packedPostings: PackedPostings, term: string): number[] | undefined {
  const view = packedPostings.findPositions(term);
  return view === undefined ? undefined : [...view];
}

describe("PackedPostings", () => {
  test("stores and returns each term's positions", () => {
    const packedPostings = createPackedPostings({ a: [0, 5, 9], b: [2], c: [1, 3, 4, 7] });

    expect(sliceArray(packedPostings, "a")).toEqual([0, 5, 9]);
    expect(sliceArray(packedPostings, "b")).toEqual([2]);
    expect(sliceArray(packedPostings, "c")).toEqual([1, 3, 4, 7]);
  });

  test("reports membership", () => {
    const packedPostings = createPackedPostings({ a: [1], b: [2] });

    expect(packedPostings.has("a")).toBe(true);
    expect(packedPostings.has("c")).toBe(false);
  });

  test("forEachTerm visits every term with its positions", () => {
    const visited: [string, number[]][] = [];

    createPackedPostings({ a: [0, 5], b: [2] }).forEachTerm((term, positionArray) => visited.push([term, [...positionArray]]));
    expect(visited).toEqual([["a", [0, 5]], ["b", [2]]]);
  });

  test("returns undefined for an unknown term", () => {
    expect(createPackedPostings({ a: [1] }).findPositions("nope")).toBeUndefined();
  });

  test("packs everything into a single backing buffer", () => {
    const packedPostings = createPackedPostings({ a: [1, 2], b: [3, 4, 5] });
    const firstPositionArray = packedPostings.findPositions("a")!;
    const secondPositionArray = packedPostings.findPositions("b")!;

    expect(firstPositionArray.buffer).toBe(secondPositionArray.buffer);
    expect(secondPositionArray.byteOffset).toBe(firstPositionArray.byteOffset + firstPositionArray.byteLength);
  });

  test("narrows the backing array to the smallest width that fits the max position", () => {
    expect(createPackedPostings({ a: [0, 255] }).findPositions("a")).toBeInstanceOf(Uint8Array);
    expect(createPackedPostings({ a: [0, 256] }).findPositions("a")).toBeInstanceOf(Uint16Array);
    expect(createPackedPostings({ a: [0, 65_535] }).findPositions("a")).toBeInstanceOf(Uint16Array);
    expect(createPackedPostings({ a: [0, 65_536] }).findPositions("a")).toBeInstanceOf(Uint32Array);
  });

  test("only stores terms the predicate calls sparse", () => {
    const packedPostings = createPackedPostings({ rare: [1], common: [0, 1, 2, 3, 4, 5] }, length => length < 3);

    expect(packedPostings.has("rare")).toBe(true);
    expect(packedPostings.has("common")).toBe(false);
    expect(packedPostings.findPositions("common")).toBeUndefined();
  });

  test("handles empty input", () => {
    const packedPostings = createPackedPostings({});

    expect(packedPostings.has("x")).toBe(false);
    expect(packedPostings.findPositions("x")).toBeUndefined();
  });

  test("rebuild replaces prior contents", () => {
    const packedPostings = new PackedPostings();

    packedPostings.pack([["a", [1, 2, 3]]], 3, 3);
    packedPostings.pack([["b", [9]]], 1, 9);
    expect(packedPostings.has("a")).toBe(false);
    expect(sliceArray(packedPostings, "b")).toEqual([9]);
  });

  test("preserves position order within a term", () => {
    expect(sliceArray(createPackedPostings({ t: [10, 20, 30, 40] }), "t")).toEqual([10, 20, 30, 40]);
  });

  test("stays correct across many rebuilds with churning term sets (oracle)", () => {
    const packedPostings = new PackedPostings();
    let rng = 987_654_321 >>> 0;
    const next = (): number => (rng = ((rng * 1_664_525) + 1_013_904_223) >>> 0) / 0x1_00_00_00_00;

    for (let round = 0; round < 200; round += 1) {
      const oracle = new Map<string, number[]>();
      const termCount = 1 + Math.floor(next() * 20);

      for (let t = 0; t < termCount; t += 1) {
        const positions: number[] = [];
        const len = 1 + Math.floor(next() * 8);

        for (let i = 0; i < len; i += 1) {
          positions.push(Math.floor(next() * 1_000));
        }
        positions.sort((a, b) => a - b);
        oracle.set(`term${t}`, positions);
      }
      const sparseTerms = [...oracle];
      const total = sparseTerms.reduce((sum, [, positions]) => sum + positions.length, 0);
      const max = Math.max(0, ...sparseTerms.flatMap(([, positions]) => positions));

      packedPostings.pack(sparseTerms, total, max);

      for (const [term, expected] of oracle) {
        expect(sliceArray(packedPostings, term)).toEqual(expected);
      }
      expect(packedPostings.has("absent")).toBe(false);
    }
  });
});
