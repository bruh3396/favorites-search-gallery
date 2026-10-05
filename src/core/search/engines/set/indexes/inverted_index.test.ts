import { Fruit, FruitName } from "@/core/search/testing/fruit_corpus";
import { describe, expect, test } from "vitest";
import { InvertedIndex } from "@/core/search/engines/set/indexes/inverted_index";

function createDoc(name: FruitName, tags: string[]): Fruit {
  return { name, tags: new Set(tags), getMetric: (): number => 0 };
}

function createIndex(...docs: Fruit[]): InvertedIndex<Fruit> {
  const index = new InvertedIndex<Fruit>(fruit => fruit.tags);

  for (const doc of docs) {
    index.addDoc(doc);
  }
  return index;
}

describe("InvertedIndex", () => {
  describe("addDoc", () => {
    test("returns only the terms that were not already indexed", () => {
      const index = createIndex();

      expect(index.addDoc(createDoc("apple", ["red", "sweet"]))).toEqual(["red", "sweet"]);
      expect(index.addDoc(createDoc("cherry", ["red", "tart"]))).toEqual(["tart"]);
    });

    test("indexes a doc again after it was removed", () => {
      const pineapple = createDoc("pineapple", ["yellow", "unique_tag"]);
      const index = createIndex(createDoc("apple", ["red"]));

      index.addDoc(pineapple);
      index.removeDoc(pineapple);
      index.addDoc(pineapple);
      expect(index.indexedTerms()).toContain("unique_tag");
      expect(index.docsForTerm("unique_tag")?.has(pineapple)).toBe(true);
    });
  });

  describe("addDocs", () => {
    test("indexes every doc and leaves the terms sorted", () => {
      const index = createIndex();

      index.addDocs([createDoc("kiwi", ["zebra", "apple"]), createDoc("mango", ["mango", "banana"])]);

      expect(index.indexedTerms()).toEqual(["apple", "banana", "mango", "zebra"]);
    });
  });

  describe("updateDocs", () => {
    test("reports terms that gained their first doc and terms that lost their last", () => {
      const apple = createDoc("apple", ["red", "sweet"]);
      const index = createIndex(apple);

      expect(index.updateDocs([{ doc: apple, oldTerms: new Set(["red", "sweet"]), newTerms: new Set(["red", "crisp"]) }]))
        .toEqual({ added: ["crisp"], removed: ["sweet"] });
      expect(index.indexedTerms()).toEqual(["crisp", "red"]);
    });

    test("ignores old terms that were never indexed", () => {
      const apple = createDoc("apple", ["red"]);
      const index = createIndex(apple);

      expect(index.updateDocs([{ doc: apple, oldTerms: new Set(["red", "ghost"]), newTerms: new Set(["red"]) }]))
        .toEqual({ added: [], removed: [] });
    });

    test("keeps a term that other docs still carry", () => {
      const apple = createDoc("apple", ["red"]);
      const cherry = createDoc("cherry", ["red"]);
      const index = createIndex(apple, cherry);

      expect(index.updateDocs([{ doc: apple, oldTerms: new Set(["red"]), newTerms: new Set() }]))
        .toEqual({ added: [], removed: [] });
      expect(index.docsForTerm("red")).toEqual(new Set([cherry]));
    });

    test("adds a doc to a term that is already indexed without reporting it", () => {
      const apple = createDoc("apple", ["red"]);
      const cherry = createDoc("cherry", ["tart"]);
      const index = createIndex(apple, cherry);

      expect(index.updateDocs([{ doc: cherry, oldTerms: new Set(["tart"]), newTerms: new Set(["tart", "red"]) }]))
        .toEqual({ added: [], removed: [] });
      expect(index.docsForTerm("red")).toEqual(new Set([apple, cherry]));
    });
  });

  describe("removeDoc", () => {
    test("drops a term once its last doc is removed", () => {
      const pineapple = createDoc("pineapple", ["yellow", "unique_tag"]);
      const index = createIndex(createDoc("apple", ["yellow"]), pineapple);

      index.removeDoc(pineapple);
      expect(index.indexedTerms()).not.toContain("unique_tag");
      expect(index.docsForTerm("unique_tag")).toBeUndefined();
    });

    test("skips terms that are not indexed", () => {
      const index = createIndex(createDoc("apple", ["red"]));

      expect(index.removeDoc(createDoc("kiwi", ["green"]))).toEqual([]);
      expect(index.indexedTerms()).toEqual(["red"]);
    });

    test("returns only the terms whose last doc was removed", () => {
      const apple = createDoc("apple", ["red", "sweet"]);
      const cherry = createDoc("cherry", ["red", "tart"]);
      const index = createIndex(apple, cherry);

      expect(index.removeDoc(cherry)).toEqual(["tart"]);
      expect(index.removeDoc(apple).sort()).toEqual(["red", "sweet"]);
    });
  });
});
