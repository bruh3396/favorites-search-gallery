import { describe, expect, test } from "vitest";
import { PackedPostings } from "@/lib/search/engines/bit/postings/packed_postings";

const anySparse = (): boolean => true;

function packed(entries: Record<string, number[]>, isSparse: (length: number) => boolean = anySparse): PackedPostings {
  const p = new PackedPostings();

  p.build(new Map(Object.entries(entries)), isSparse);
  return p;
}

function sliceArray(p: PackedPostings, term: string): number[] | undefined {
  const view = p.slice(term);
  return view === undefined ? undefined : [...view];
}

describe("PackedPostings", () => {
  test("stores and returns each term's positions", () => {
    const p = packed({ a: [0, 5, 9], b: [2], c: [1, 3, 4, 7] });

    expect(sliceArray(p, "a")).toEqual([0, 5, 9]);
    expect(sliceArray(p, "b")).toEqual([2]);
    expect(sliceArray(p, "c")).toEqual([1, 3, 4, 7]);
  });

  test("reports membership", () => {
    const p = packed({ a: [1], b: [2] });

    expect(p.has("a")).toBe(true);
    expect(p.has("missing")).toBe(false);
  });

  test("returns undefined for an unknown term", () => {
    expect(packed({ a: [1] }).slice("nope")).toBeUndefined();
  });

  test("packs everything into a single backing buffer", () => {
    const p = packed({ a: [1, 2], b: [3, 4, 5] });
    const a = p.slice("a") as Int32Array;
    const b = p.slice("b") as Int32Array;

    expect(a.buffer).toBe(b.buffer);
    expect(b.byteOffset).toBe(a.byteOffset + a.byteLength);
  });

  test("only stores terms the predicate calls sparse", () => {
    const p = packed({ rare: [1], common: [0, 1, 2, 3, 4, 5] }, length => length < 3);

    expect(p.has("rare")).toBe(true);
    expect(p.has("common")).toBe(false);
    expect(p.slice("common")).toBeUndefined();
  });

  test("handles empty input", () => {
    const p = packed({});

    expect(p.has("x")).toBe(false);
    expect(p.slice("x")).toBeUndefined();
  });

  test("rebuild replaces prior contents", () => {
    const p = new PackedPostings();

    p.build(new Map([["a", [1, 2, 3]]]), anySparse);
    p.build(new Map([["b", [9]]]), anySparse);
    expect(p.has("a")).toBe(false);
    expect(sliceArray(p, "b")).toEqual([9]);
  });

  test("preserves position order within a term", () => {
    expect(sliceArray(packed({ t: [10, 20, 30, 40] }), "t")).toEqual([10, 20, 30, 40]);
  });

  test("stays correct across many rebuilds with churning term sets (oracle)", () => {
    const p = new PackedPostings();
    let rng = 987654321 >>> 0;
    const next = (): number => (rng = ((rng * 1664525) + 1013904223) >>> 0) / 0x100000000;

    for (let round = 0; round < 200; round += 1) {
      const oracle = new Map<string, number[]>();
      const termCount = 1 + Math.floor(next() * 20);

      for (let t = 0; t < termCount; t += 1) {
        const positions: number[] = [];
        const len = 1 + Math.floor(next() * 8);

        for (let i = 0; i < len; i += 1) {
          positions.push(Math.floor(next() * 1000));
        }
        positions.sort((a, b) => a - b);
        oracle.set(`term${t}`, positions);
      }
      p.build(oracle, anySparse);

      for (const [term, expected] of oracle) {
        expect(sliceArray(p, term)).toEqual(expected);
      }
      expect(p.has("absent")).toBe(false);
    }
  });
});
