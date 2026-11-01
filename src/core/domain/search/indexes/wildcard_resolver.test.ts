import { describe, expect, test, vi } from "vitest";
import { StringInterner } from "@/core/utils/string/string_interner";
import { WildcardResolver } from "@/core/domain/search/indexes/wildcard_resolver";
import { parseWildcardSearchTerm } from "@/core/domain/search/parsers/search_term_parser";

const TERMS = ["banana", "bandana", "cabana", "canvas", "brand"];

class ListResolver extends WildcardResolver<string[]> {
  public combine = vi.fn((matches: string[]): string[] => [...matches].sort());
}

function createResolver(terms: string[] = TERMS): ListResolver {
  const listResolver = new ListResolver(new StringInterner());

  listResolver.index(terms);
  return listResolver;
}

function resolve(listResolver: ListResolver, pattern: string): string[] {
  return listResolver.resolve(parseWildcardSearchTerm(pattern));
}

describe("WildcardResolver", () => {
  describe("resolve", () => {
    test("combines the matcher's hits for a pattern", () => {
      expect(resolve(createResolver(), "ban*")).toEqual(["bandana", "banana"].sort());
    });

    test("returns whatever combine produces for an empty match, including a falsy value", () => {
      const listResolver = createResolver();

      listResolver.combine.mockReturnValue([]);
      expect(resolve(listResolver, "zzz*")).toEqual([]);
    });

    test("memoizes per wildcard shape and combines each shape once", () => {
      const listResolver = createResolver();

      resolve(listResolver, "ban*");
      resolve(listResolver, "ban*");
      resolve(listResolver, "*ana");
      expect(listResolver.combine).toHaveBeenCalledTimes(2);
    });

    test("caches a result even when combine returns undefined-like empties", () => {
      const listResolver = createResolver();

      listResolver.combine.mockReturnValue([]);
      const wildcardSearchTerm = parseWildcardSearchTerm("zzz*");

      listResolver.resolve(wildcardSearchTerm);
      listResolver.resolve(wildcardSearchTerm);
      expect(listResolver.combine).toHaveBeenCalledOnce();
    });
  });

  describe("index", () => {
    test("rebuilds the matcher and invalidates the cache", () => {
      const listResolver = createResolver();

      resolve(listResolver, "ban*");
      listResolver.index(TERMS);
      resolve(listResolver, "ban*");
      expect(listResolver.combine).toHaveBeenCalledTimes(2);
    });
  });

  describe("add", () => {
    test("makes a new term matchable and invalidates the cache", () => {
      const listResolver = createResolver();

      expect(resolve(listResolver, "ban*")).toEqual(["bandana", "banana"].sort());
      listResolver.add("bang");
      expect(resolve(listResolver, "ban*")).toEqual(["banana", "bandana", "bang"].sort());
    });
  });

  describe("remove", () => {
    test("drops a term and invalidates the cache", () => {
      const listResolver = createResolver();

      expect(resolve(listResolver, "ban*")).toEqual(["bandana", "banana"].sort());
      listResolver.remove("bandana");
      expect(resolve(listResolver, "ban*")).toEqual(["banana"]);
    });
  });
});
