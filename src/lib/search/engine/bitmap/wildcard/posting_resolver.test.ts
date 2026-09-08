import { DensePosting, Posting } from "@/lib/search/engine/bitmap/bits/posting";
import { describe, expect, test } from "vitest";
import { BitmapIndex } from "@/lib/search/engine/bitmap/indexes/index";
import { WildcardPostingResolver } from "@/lib/search/engine/bitmap/wildcard/posting_resolver";
import { parseWildcardSearchTerm } from "@/lib/search/query/parsers/search_term_parser";

interface Doc {
  id: string;
  tags: string[];
}

function doc(id: string, ...tags: string[]): Doc {
  return { id, tags };
}

const corpus: Doc[] = [
  doc("banana", "banana"),
  doc("bandana", "bandana"),
  doc("cabana", "cabana"),
  doc("canvas", "canvas"),
  doc("brand", "brand")
];

interface Harness {
  bitmapIndex: BitmapIndex<Doc>;
  resolver: WildcardPostingResolver;
  unions: number;
  resolveIds(pattern: string): string[];
}

function harness(docs: Doc[] = corpus): Harness {
  const bitmapIndex = new BitmapIndex<Doc>(d => d.tags);

  bitmapIndex.build(docs);
  const state = { unions: 0 };
  const resolver = new WildcardPostingResolver(postings => {
    state.unions += 1;
    return new DensePosting(bitmapIndex.unionOfPostings(postings));
  });

  resolver.index(bitmapIndex.postingEntries());
  return {
    bitmapIndex,
    resolver,
    get unions(): number {
      return state.unions;
    },
    resolveIds(pattern: string): string[] {
      const posting: Posting | undefined = resolver.resolve(parseWildcardSearchTerm(pattern));
      return posting === undefined ? [] : bitmapIndex.docsFrom(posting.toBitSet(bitmapIndex.width)).map(d => d.id).sort();
    }
  };
}

describe("WildcardPostingResolver", () => {
  test("resolves a prefix wildcard to the union of its terms' docs", () => {
    expect(harness().resolveIds("ban*")).toEqual(["banana", "bandana"]);
  });

  test("resolves a suffix wildcard", () => {
    expect(harness().resolveIds("*ana")).toEqual(["banana", "bandana", "cabana"]);
  });

  test("resolves a substring wildcard", () => {
    expect(harness().resolveIds("*and*")).toEqual(["bandana", "brand"]);
  });

  test("resolves a multi-star wildcard through the regex path", () => {
    expect(harness().resolveIds("b*na")).toEqual(["banana", "bandana"]);
  });

  test("returns undefined when nothing matches", () => {
    expect(harness().resolveIds("zzz*")).toEqual([]);
  });
});

describe("WildcardPostingResolver caching", () => {
  test("unions a pattern once and serves the same posting on repeat", () => {
    const h = harness();
    const term = parseWildcardSearchTerm("ban*");
    const first = h.resolver.resolve(term);
    const second = h.resolver.resolve(term);

    expect(h.unions).toBe(1);
    expect(second).toBe(first);
  });

  test("keys the cache per wildcard shape", () => {
    const h = harness();

    h.resolver.resolve(parseWildcardSearchTerm("ban*"));
    h.resolver.resolve(parseWildcardSearchTerm("*ana"));
    h.resolver.resolve(parseWildcardSearchTerm("*and*"));
    expect(h.unions).toBe(3);
  });

  test("caches the empty result without re-resolving", () => {
    const h = harness();
    const term = parseWildcardSearchTerm("zzz*");

    expect(h.resolver.resolve(term)).toBeUndefined();
    expect(h.resolver.resolve(term)).toBeUndefined();
    expect(h.unions).toBe(0);
  });

  test("index() invalidates the cached union", () => {
    const h = harness();

    expect(h.resolveIds("ban*")).toEqual(["banana", "bandana"]);
    h.resolver.index(h.bitmapIndex.postingEntries());
    expect(h.resolveIds("ban*")).toEqual(["banana", "bandana"]);
    expect(h.unions).toBe(2);
  });
});
