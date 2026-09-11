import { describe, expect, test, vi } from "vitest";
import { InvertedIndex } from "@/lib/search/engines/set/indexes/inverted_index";
import { WildcardDocResolver } from "@/lib/search/engines/set/resolution/wildcard_doc_resolver";
import { parseWildcardSearchTerm } from "@/lib/search/parsers/search_term_parser";

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
  termIndex: InvertedIndex<Doc>;
  resolver: WildcardDocResolver<Doc>;
  unions: number;
  resolveIds(pattern: string): string[];
}

function harness(docs: Doc[] = corpus): Harness {
  const termIndex = new InvertedIndex<Doc>(d => d.tags);

  termIndex.addDocs(docs);
  const unionSpy = vi.spyOn(termIndex, "docsForTerm");
  const resolver = new WildcardDocResolver(termIndex);

  resolver.index(termIndex.indexedTerms());
  unionSpy.mockClear();
  return {
    termIndex,
    resolver,
    get unions(): number {
      return unionSpy.mock.calls.length;
    },
    resolveIds(pattern: string): string[] {
      return [...resolver.resolve(parseWildcardSearchTerm(pattern))].map(d => d.id).sort();
    }
  };
}

describe("WildcardDocResolver", () => {
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

  test("returns an empty set when nothing matches", () => {
    expect(harness().resolveIds("zzz*")).toEqual([]);
  });
});

describe("WildcardDocResolver caching", () => {
  test("unions a pattern once and serves the same set on repeat", () => {
    const h = harness();
    const term = parseWildcardSearchTerm("ban*");
    const first = h.resolver.resolve(term);
    const second = h.resolver.resolve(term);

    expect(second).toBe(first);
    expect(h.unions).toBe(2);
  });

  test("caches the empty result without re-resolving", () => {
    const h = harness();
    const term = parseWildcardSearchTerm("zzz*");

    expect(h.resolver.resolve(term).size).toBe(0);
    h.resolver.resolve(term);
    expect(h.unions).toBe(0);
  });

  test("index() invalidates the cached union", () => {
    const h = harness();

    expect(h.resolveIds("ban*")).toEqual(["banana", "bandana"]);
    h.resolver.index(h.termIndex.indexedTerms());
    expect(h.resolveIds("ban*")).toEqual(["banana", "bandana"]);
    expect(h.unions).toBe(4);
  });

  test("add() makes a new term matchable and invalidates the cache", () => {
    const h = harness();

    expect(h.resolveIds("ban*")).toEqual(["banana", "bandana"]);
    h.termIndex.addDoc(doc("bang", "bang"));
    h.resolver.add("bang");
    expect(h.resolveIds("ban*")).toEqual(["banana", "bandana", "bang"]);
  });

  test("remove() drops a term and invalidates the cache", () => {
    const h = harness();

    expect(h.resolveIds("ban*")).toEqual(["banana", "bandana"]);
    h.resolver.remove("bandana");
    expect(h.resolveIds("ban*")).toEqual(["banana"]);
  });
});
