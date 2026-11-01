import { Fruit, FruitName } from "@/core/domain/search/testing/fruit";
import { describe, expect, test } from "vitest";
import { InvertedIndex } from "@/core/domain/search/engines/set/indexes/inverted_index";

function createDoc(fruitName: FruitName, tags: string[]): Fruit {
  return { name: fruitName, tags: new Set(tags), getMetric: (): number => 0 };
}

function createIndex(...fruits: Fruit[]): InvertedIndex<Fruit> {
  const invertedIndex = new InvertedIndex<Fruit>(fruit => fruit.tags);

  for (const fruit of fruits) {
    invertedIndex.addDoc(fruit);
  }
  return invertedIndex;
}

describe("InvertedIndex", () => {
  describe("addDoc", () => {
    test("returns only the terms that were not already indexed", () => {
      const invertedIndex = createIndex();

      expect(invertedIndex.addDoc(createDoc("apple", ["red", "sweet"]))).toEqual(["red", "sweet"]);
      expect(invertedIndex.addDoc(createDoc("cherry", ["red", "tart"]))).toEqual(["tart"]);
    });

    test("indexes a doc again after it was removed", () => {
      const pineappleFruit = createDoc("pineapple", ["yellow", "unique_tag"]);
      const invertedIndex = createIndex(createDoc("apple", ["red"]));

      invertedIndex.addDoc(pineappleFruit);
      invertedIndex.removeDoc(pineappleFruit);
      invertedIndex.addDoc(pineappleFruit);
      expect(invertedIndex.indexedTerms()).toContain("unique_tag");
      expect(invertedIndex.docsForTerm("unique_tag")?.has(pineappleFruit)).toBe(true);
    });
  });

  describe("addDocs", () => {
    test("indexes every doc and leaves the terms sorted", () => {
      const invertedIndex = createIndex();

      invertedIndex.addDocs([createDoc("kiwi", ["zebra", "apple"]), createDoc("mango", ["mango", "banana"])]);

      expect(invertedIndex.indexedTerms()).toEqual(["apple", "banana", "mango", "zebra"]);
    });
  });

  describe("updateDocs", () => {
    test("reports terms that gained their first doc and terms that lost their last", () => {
      const appleFruit = createDoc("apple", ["red", "sweet"]);
      const invertedIndex = createIndex(appleFruit);

      expect(invertedIndex.updateDocs([{ doc: appleFruit, oldTerms: new Set(["red", "sweet"]), newTerms: new Set(["red", "crisp"]) }]))
        .toEqual({ added: ["crisp"], removed: ["sweet"] });
      expect(invertedIndex.indexedTerms()).toEqual(["crisp", "red"]);
    });

    test("ignores old terms that were never indexed", () => {
      const appleFruit = createDoc("apple", ["red"]);
      const invertedIndex = createIndex(appleFruit);

      expect(invertedIndex.updateDocs([{ doc: appleFruit, oldTerms: new Set(["red", "ghost"]), newTerms: new Set(["red"]) }]))
        .toEqual({ added: [], removed: [] });
    });

    test("keeps a term that other docs still carry", () => {
      const appleFruit = createDoc("apple", ["red"]);
      const cherryFruit = createDoc("cherry", ["red"]);
      const invertedIndex = createIndex(appleFruit, cherryFruit);

      expect(invertedIndex.updateDocs([{ doc: appleFruit, oldTerms: new Set(["red"]), newTerms: new Set() }]))
        .toEqual({ added: [], removed: [] });
      expect(invertedIndex.docsForTerm("red")).toEqual(new Set([cherryFruit]));
    });

    test("adds a doc to a term that is already indexed without reporting it", () => {
      const appleFruit = createDoc("apple", ["red"]);
      const cherryFruit = createDoc("cherry", ["tart"]);
      const invertedIndex = createIndex(appleFruit, cherryFruit);

      expect(invertedIndex.updateDocs([{ doc: cherryFruit, oldTerms: new Set(["tart"]), newTerms: new Set(["tart", "red"]) }]))
        .toEqual({ added: [], removed: [] });
      expect(invertedIndex.docsForTerm("red")).toEqual(new Set([appleFruit, cherryFruit]));
    });
  });

  describe("removeDoc", () => {
    test("drops a term once its last doc is removed", () => {
      const pineappleFruit = createDoc("pineapple", ["yellow", "unique_tag"]);
      const invertedIndex = createIndex(createDoc("apple", ["yellow"]), pineappleFruit);

      invertedIndex.removeDoc(pineappleFruit);
      expect(invertedIndex.indexedTerms()).not.toContain("unique_tag");
      expect(invertedIndex.docsForTerm("unique_tag")).toBeUndefined();
    });

    test("skips terms that are not indexed", () => {
      const invertedIndex = createIndex(createDoc("apple", ["red"]));

      expect(invertedIndex.removeDoc(createDoc("kiwi", ["green"]))).toEqual([]);
      expect(invertedIndex.indexedTerms()).toEqual(["red"]);
    });

    test("returns only the terms whose last doc was removed", () => {
      const appleFruit = createDoc("apple", ["red", "sweet"]);
      const cherryFruit = createDoc("cherry", ["red", "tart"]);
      const invertedIndex = createIndex(appleFruit, cherryFruit);

      expect(invertedIndex.removeDoc(cherryFruit)).toEqual(["tart"]);
      expect(invertedIndex.removeDoc(appleFruit).sort()).toEqual(["red", "sweet"]);
    });
  });
});
