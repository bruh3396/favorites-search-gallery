import { describe, expect, test, vi } from "vitest";
import { BitIndex } from "@/core/domain/search/engines/bit/indexes/bit_index";
import { Posting } from "@/core/domain/search/engines/bit/posting/posting";
import { WildcardPostingResolver } from "@/core/domain/search/engines/bit/resolution/wildcard_posting_resolver";
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
  bitIndex: BitIndex<Doc>;
  wildcardPostingResolver: WildcardPostingResolver<Doc>;
  unions: number;
  resolveIds(pattern: string): string[];
}

function setup(docs: Doc[] = defaultDocs): Harness {
  const bitIndex = new BitIndex<Doc>({ getTerms: doc => doc.tags, stringInterner: new StringInterner() });

  bitIndex.build(docs);
  const unionSpy = vi.spyOn(bitIndex, "unionOf");
  const wildcardPostingResolver = new WildcardPostingResolver({ bitIndex, stringInterner: new StringInterner() });

  wildcardPostingResolver.index(bitIndex.indexedTerms());
  return {
    bitIndex,
    wildcardPostingResolver,
    get unions(): number {
      return unionSpy.mock.calls.length;
    },
    resolveIds(pattern: string): string[] {
      const posting: Posting | undefined = wildcardPostingResolver.resolve(parseWildcardSearchTerm(pattern));
      return posting === undefined ? [] : bitIndex.docsFrom(posting.toBitSet(bitIndex.width)).map(doc => doc.id).sort();
    }
  };
}

describe("WildcardPostingResolver", () => {
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

    test("resolves nothing when nothing matches", () => {
      expect(setup().resolveIds("zzz*")).toEqual([]);
    });

    test("skips resolver terms that have no posting in the index", () => {
      const harness = setup();

      harness.wildcardPostingResolver.add("bang");
      expect(harness.resolveIds("ban*")).toEqual(["banana", "bandana"]);
    });

    test("unions a pattern once and serves the same posting on repeat", () => {
      const harness = setup();
      const wildcardSearchTerm = parseWildcardSearchTerm("ban*");
      const firstPosting = harness.wildcardPostingResolver.resolve(wildcardSearchTerm);
      const secondPosting = harness.wildcardPostingResolver.resolve(wildcardSearchTerm);

      expect(harness.unions).toBe(1);
      expect(secondPosting).toBe(firstPosting);
    });

    test("keys the cache per wildcard shape", () => {
      const harness = setup();

      harness.wildcardPostingResolver.resolve(parseWildcardSearchTerm("ban*"));
      harness.wildcardPostingResolver.resolve(parseWildcardSearchTerm("*ana"));
      harness.wildcardPostingResolver.resolve(parseWildcardSearchTerm("*and*"));
      expect(harness.unions).toBe(3);
    });

    test("caches the empty result without re-resolving", () => {
      const harness = setup();
      const wildcardSearchTerm = parseWildcardSearchTerm("zzz*");

      expect(harness.wildcardPostingResolver.resolve(wildcardSearchTerm)).toBeUndefined();
      expect(harness.wildcardPostingResolver.resolve(wildcardSearchTerm)).toBeUndefined();
      expect(harness.unions).toBe(0);
    });
  });

  describe("index", () => {
    test("invalidates the cached union", () => {
      const harness = setup();

      expect(harness.resolveIds("ban*")).toEqual(["banana", "bandana"]);
      harness.wildcardPostingResolver.index(harness.bitIndex.indexedTerms());
      expect(harness.resolveIds("ban*")).toEqual(["banana", "bandana"]);
      expect(harness.unions).toBe(2);
    });
  });
});
