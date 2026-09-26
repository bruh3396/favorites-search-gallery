import { describe, expect, test, vi } from "vitest";
import { WildcardResolver } from "@/lib/search/indexes/wildcard_resolver";
import { parseWildcardSearchTerm } from "@/lib/search/parsers/search_term_parser";

const TERMS = ["banana", "bandana", "cabana", "canvas", "brand"];

class ListResolver extends WildcardResolver<string[]> {
  public combine = vi.fn((matches: string[]): string[] => matches.slice().sort());
}

function createResolver(terms: string[] = TERMS): ListResolver {
  const r = new ListResolver();

  r.index(terms);
  return r;
}

function resolve(r: ListResolver, pattern: string): string[] {
  return r.resolve(parseWildcardSearchTerm(pattern));
}

describe("WildcardResolver", () => {
  test("combines the matcher's hits for a pattern", () => {
    expect(resolve(createResolver(), "ban*")).toEqual(["bandana", "banana"].sort());
  });

  test("returns whatever combine produces for an empty match, including a falsy value", () => {
    const r = createResolver();

    r.combine.mockReturnValue([]);
    expect(resolve(r, "zzz*")).toEqual([]);
  });

  test("memoizes per wildcard shape and combines each shape once", () => {
    const r = createResolver();

    resolve(r, "ban*");
    resolve(r, "ban*");
    resolve(r, "*ana");
    expect(r.combine).toHaveBeenCalledTimes(2);
  });

  test("caches a result even when combine returns undefined-like empties", () => {
    const r = createResolver();

    r.combine.mockReturnValue([]);
    const term = parseWildcardSearchTerm("zzz*");

    r.resolve(term);
    r.resolve(term);
    expect(r.combine).toHaveBeenCalledTimes(1);
  });

  test("index() rebuilds the matcher and invalidates the cache", () => {
    const r = createResolver();

    resolve(r, "ban*");
    r.index(TERMS);
    resolve(r, "ban*");
    expect(r.combine).toHaveBeenCalledTimes(2);
  });

  test("add() makes a new term matchable and invalidates the cache", () => {
    const r = createResolver();

    expect(resolve(r, "ban*")).toEqual(["bandana", "banana"].sort());
    r.add("bang");
    expect(resolve(r, "ban*")).toEqual(["banana", "bandana", "bang"].sort());
  });

  test("remove() drops a term and invalidates the cache", () => {
    const r = createResolver();

    expect(resolve(r, "ban*")).toEqual(["bandana", "banana"].sort());
    r.remove("bandana");
    expect(resolve(r, "ban*")).toEqual(["banana"]);
  });
});
