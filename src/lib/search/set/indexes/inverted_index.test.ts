import { Fruit, FruitName, index } from "@/lib/search/testing/fruit_corpus";
import { describe, expect, test } from "vitest";
import { InvertedIndex } from "@/lib/search/set/indexes/inverted_index";

function makeDoc(name: FruitName, tags: string[]): Fruit {
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

    bulk.addDocs([makeDoc("kiwi", ["zebra", "apple"]), makeDoc("mango", ["mango", "banana"])]);

    expect(bulk.indexedTerms()).toEqual(["apple", "banana", "mango", "zebra"]);
  });
});

describe("addDoc return value", () => {
  test("returns only the terms that were not already indexed", () => {
    const freshIndex = new InvertedIndex<Fruit>(fruit => fruit.tags);

    expect(freshIndex.addDoc(makeDoc("apple", ["red", "sweet"]))).toEqual(["red", "sweet"]);
    expect(freshIndex.addDoc(makeDoc("cherry", ["red", "tart"]))).toEqual(["tart"]);
  });
});

describe("removeDoc return value", () => {
  test("returns only the terms whose last doc was removed", () => {
    const freshIndex = new InvertedIndex<Fruit>(fruit => fruit.tags);
    const apple = makeDoc("apple", ["red", "sweet"]);
    const cherry = makeDoc("cherry", ["red", "tart"]);

    freshIndex.addDoc(apple);
    freshIndex.addDoc(cherry);

    expect(freshIndex.removeDoc(cherry)).toEqual(["tart"]);
    expect(freshIndex.removeDoc(apple).sort()).toEqual(["red", "sweet"]);
  });
});
