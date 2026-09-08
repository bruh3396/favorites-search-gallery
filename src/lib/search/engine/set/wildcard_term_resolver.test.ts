import { describe, expect, test } from "vitest";
import { WildcardTermResolver } from "@/lib/search/engine/set/wildcard_term_resolver";

const terms = ["banana", "bandana", "cabana", "canvas", "brand", "sandbox"].slice().sort();

function sorted(values: string[]): string[] {
  return values.slice().sort();
}

describe("WildcardTermResolver", () => {
  const resolver = new WildcardTermResolver(terms);

  test("termsStartingWith delegates to the prefix index", () => {
    expect(sorted(resolver.termsStartingWith("ban"))).toEqual(["banana", "bandana"]);
  });

  test("termsContaining delegates to the trigram index", () => {
    expect(sorted(resolver.termsContaining("ana"))).toEqual(["banana", "bandana", "cabana"]);
  });

  test("termsEndingWith delegates to the trigram index", () => {
    expect(sorted(resolver.termsEndingWith("ana"))).toEqual(["banana", "bandana", "cabana"]);
  });

  test("termsMatching requires every fragment via the predicate", () => {
    const ordered = /ban.*ana/;

    expect(sorted(resolver.termsMatching(["ban", "ana"], term => ordered.test(term), ordered.source))).toEqual(["banana", "bandana"]);
  });

  test("an empty resolver finds nothing", () => {
    const empty = new WildcardTermResolver();

    expect(empty.termsStartingWith("ban")).toEqual([]);
    expect(empty.termsContaining("ana")).toEqual([]);
  });
});

describe("WildcardTermResolver mutation", () => {
  test("addTerm makes a term findable by prefix and by substring", () => {
    const resolver = new WildcardTermResolver(terms);

    resolver.addTerm("banjo");

    expect(sorted(resolver.termsStartingWith("ban"))).toEqual(["banana", "bandana", "banjo"]);
    expect(resolver.termsContaining("anj")).toEqual(["banjo"]);
  });

  test("removeTerm drops a term from both the prefix and trigram sides", () => {
    const resolver = new WildcardTermResolver(terms);

    resolver.removeTerm("banana");

    expect(sorted(resolver.termsStartingWith("ban"))).toEqual(["bandana"]);
    expect(sorted(resolver.termsContaining("ana"))).toEqual(["bandana", "cabana"]);
  });

  test("index rebuilds both indexes from a fresh corpus", () => {
    const resolver = new WildcardTermResolver(terms);

    resolver.index(["mango", "tango"]);

    expect(resolver.termsStartingWith("ban")).toEqual([]);
    expect(sorted(resolver.termsEndingWith("ango"))).toEqual(["mango", "tango"]);
  });
});
