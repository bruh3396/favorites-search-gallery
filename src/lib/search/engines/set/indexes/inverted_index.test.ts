import { Fruit, FruitName, index } from "@/lib/search/testing/fruit_corpus";
import { describe, expect, test } from "vitest";
import { InvertedIndex } from "@/lib/search/engines/set/indexes/inverted_index";

function createDoc(name: FruitName, tags: string[]): Fruit {
  return { name, tags: new Set(tags), getMetric: (): number => 0 };
}

function expectIndexed(term: string, indexed: boolean): void {
  expect(index.indexedTerms().includes(term)).toBe(indexed);
}

describe("index", () => {
  test("removeDoc", () => {
    const item: Fruit = {name: "pineapple", tags: new Set<string>(["yellow", "spiky", "sour", "sweet", "unique_tag"]), getMetric: (): number => 0};

    expectIndexed("unique_tag", false);

    index.addDoc(item);
    expectIndexed("unique_tag", true);
    expect(index.docsForTerm("unique_tag")?.has(item)).toBe(true);

    index.removeDoc(item);
    expectIndexed("unique_tag", false);
    expect(index.docsForTerm("unique_tag")).toBeUndefined();

    index.addDoc(item);
    expectIndexed("unique_tag", true);
    expect(index.docsForTerm("unique_tag")?.has(item)).toBe(true);
  });
});

describe("addDocs", () => {
  test("indexes every doc and leaves the terms sorted", () => {
    const bulk = new InvertedIndex<Fruit>(fruit => fruit.tags);

    bulk.addDocs([createDoc("kiwi", ["zebra", "apple"]), createDoc("mango", ["mango", "banana"])]);

    expect(bulk.indexedTerms()).toEqual(["apple", "banana", "mango", "zebra"]);
  });
});

describe("addDoc return value", () => {
  test("returns only the terms that were not already indexed", () => {
    const freshIndex = new InvertedIndex<Fruit>(fruit => fruit.tags);

    expect(freshIndex.addDoc(createDoc("apple", ["red", "sweet"]))).toEqual(["red", "sweet"]);
    expect(freshIndex.addDoc(createDoc("cherry", ["red", "tart"]))).toEqual(["tart"]);
  });
});

describe("updateDocs", () => {
  test("reports terms that gained their first doc and terms that lost their last", () => {
    const freshIndex = new InvertedIndex<Fruit>(fruit => fruit.tags);
    const apple = createDoc("apple", ["red", "sweet"]);

    freshIndex.addDoc(apple);

    expect(freshIndex.updateDocs([{ doc: apple, oldTerms: new Set(["red", "sweet"]), newTerms: new Set(["red", "crisp"]) }]))
      .toEqual({ added: ["crisp"], removed: ["sweet"] });
    expect(freshIndex.indexedTerms()).toEqual(["crisp", "red"]);
  });

  test("ignores old terms that were never indexed", () => {
    const freshIndex = new InvertedIndex<Fruit>(fruit => fruit.tags);
    const apple = createDoc("apple", ["red"]);

    freshIndex.addDoc(apple);

    expect(freshIndex.updateDocs([{ doc: apple, oldTerms: new Set(["red", "ghost"]), newTerms: new Set(["red"]) }]))
      .toEqual({ added: [], removed: [] });
  });

  test("keeps a term that other docs still carry", () => {
    const freshIndex = new InvertedIndex<Fruit>(fruit => fruit.tags);
    const apple = createDoc("apple", ["red"]);
    const cherry = createDoc("cherry", ["red"]);

    freshIndex.addDoc(apple);
    freshIndex.addDoc(cherry);

    expect(freshIndex.updateDocs([{ doc: apple, oldTerms: new Set(["red"]), newTerms: new Set() }]))
      .toEqual({ added: [], removed: [] });
    expect(freshIndex.docsForTerm("red")).toEqual(new Set([cherry]));
  });

  test("adds a doc to a term that is already indexed without reporting it", () => {
    const freshIndex = new InvertedIndex<Fruit>(fruit => fruit.tags);
    const apple = createDoc("apple", ["red"]);
    const cherry = createDoc("cherry", ["tart"]);

    freshIndex.addDoc(apple);
    freshIndex.addDoc(cherry);

    expect(freshIndex.updateDocs([{ doc: cherry, oldTerms: new Set(["tart"]), newTerms: new Set(["tart", "red"]) }]))
      .toEqual({ added: [], removed: [] });
    expect(freshIndex.docsForTerm("red")).toEqual(new Set([apple, cherry]));
  });
});

describe("removeDoc return value", () => {
  test("skips terms that are not indexed", () => {
    const freshIndex = new InvertedIndex<Fruit>(fruit => fruit.tags);

    freshIndex.addDoc(createDoc("apple", ["red"]));

    expect(freshIndex.removeDoc(createDoc("kiwi", ["green"]))).toEqual([]);
    expect(freshIndex.indexedTerms()).toEqual(["red"]);
  });

  test("returns only the terms whose last doc was removed", () => {
    const freshIndex = new InvertedIndex<Fruit>(fruit => fruit.tags);
    const apple = createDoc("apple", ["red", "sweet"]);
    const cherry = createDoc("cherry", ["red", "tart"]);

    freshIndex.addDoc(apple);
    freshIndex.addDoc(cherry);

    expect(freshIndex.removeDoc(cherry)).toEqual(["tart"]);
    expect(freshIndex.removeDoc(apple).sort()).toEqual(["red", "sweet"]);
  });
});
