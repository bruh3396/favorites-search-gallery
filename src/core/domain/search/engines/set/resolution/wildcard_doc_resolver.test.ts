import { describe, expect, test, vi } from "vitest";
import { InvertedIndex } from "@/core/domain/search/engines/set/indexes/inverted_index";
import { WildcardDocResolver } from "@/core/domain/search/engines/set/resolution/wildcard_doc_resolver";
import { parseWildcardSearchTerm } from "@/core/domain/search/parsers/search_term_parser";
import { StringInterner } from "@/core/utils/string/string_interner";

interface Doc {
  id: string;
  tags: string[];
}

function createDoc(id: string, ...tags: string[]): Doc {
  return { id, tags };
}

const defaultDocs: Doc[] = [
  createDoc("banana", "banana"),
  createDoc("bandana", "bandana"),
  createDoc("cabana", "cabana"),
  createDoc("canvas", "canvas"),
  createDoc("brand", "brand")
];

interface Harness {
  invertedIndex: InvertedIndex<Doc>;
  wildcardDocResolver: WildcardDocResolver<Doc>;
  unions: number;
  resolveIds(pattern: string): string[];
}

function setup(docs: Doc[] = defaultDocs): Harness {
  const invertedIndex = new InvertedIndex<Doc>(doc => doc.tags);

  invertedIndex.addDocs(docs);
  const unionSpy = vi.spyOn(invertedIndex, "docsForTerm");
  const wildcardDocResolver = new WildcardDocResolver({ invertedIndex, stringInterner: new StringInterner() });

  wildcardDocResolver.index(invertedIndex.indexedTerms());
  unionSpy.mockClear();
  return {
    invertedIndex,
    wildcardDocResolver,
    get unions(): number {
      return unionSpy.mock.calls.length;
    },
    resolveIds(pattern: string): string[] {
      return [...wildcardDocResolver.resolve(parseWildcardSearchTerm(pattern))].map(doc => doc.id).sort();
    }
  };
}

describe("WildcardDocResolver", () => {
  describe("resolve", () => {
    test("resolves a prefix wildcard to the union of its terms' docs", () => {
      expect(setup().resolveIds("ban*")).toEqual(["banana", "bandana"]);
    });

    test("resolves a suffix wildcard", () => {
      expect(setup().resolveIds("*ana")).toEqual(["banana", "bandana", "cabana"]);
    });

    test("resolves a substring wildcard", () => {
      expect(setup().resolveIds("*and*")).toEqual(["bandana", "brand"]);
    });

    test("resolves a multi-star wildcard through the regex path", () => {
      expect(setup().resolveIds("b*na")).toEqual(["banana", "bandana"]);
    });

    test("returns an empty set when nothing matches", () => {
      expect(setup().resolveIds("zzz*")).toEqual([]);
    });

    test("unions a pattern once and serves the same set on repeat", () => {
      const harness = setup();
      const wildcardSearchTerm = parseWildcardSearchTerm("ban*");
      const first = harness.wildcardDocResolver.resolve(wildcardSearchTerm);
      const second = harness.wildcardDocResolver.resolve(wildcardSearchTerm);

      expect(second).toBe(first);
      expect(harness.unions).toBe(2);
    });

    test("caches the empty result without re-resolving", () => {
      const harness = setup();
      const wildcardSearchTerm = parseWildcardSearchTerm("zzz*");

      expect(harness.wildcardDocResolver.resolve(wildcardSearchTerm).size).toBe(0);
      harness.wildcardDocResolver.resolve(wildcardSearchTerm);
      expect(harness.unions).toBe(0);
    });
  });

  describe("index", () => {
    test("invalidates the cached union", () => {
      const harness = setup();

      expect(harness.resolveIds("ban*")).toEqual(["banana", "bandana"]);
      harness.wildcardDocResolver.index(harness.invertedIndex.indexedTerms());
      expect(harness.resolveIds("ban*")).toEqual(["banana", "bandana"]);
      expect(harness.unions).toBe(4);
    });
  });

  describe("add", () => {
    test("makes a new term matchable and invalidates the cache", () => {
      const harness = setup();

      expect(harness.resolveIds("ban*")).toEqual(["banana", "bandana"]);
      harness.invertedIndex.addDoc(createDoc("bang", "bang"));
      harness.wildcardDocResolver.add("bang");
      expect(harness.resolveIds("ban*")).toEqual(["banana", "bandana", "bang"]);
    });
  });

  describe("remove", () => {
    test("drops a term and invalidates the cache", () => {
      const harness = setup();

      expect(harness.resolveIds("ban*")).toEqual(["banana", "bandana"]);
      harness.wildcardDocResolver.remove("bandana");
      expect(harness.resolveIds("ban*")).toEqual(["banana"]);
    });
  });
});
