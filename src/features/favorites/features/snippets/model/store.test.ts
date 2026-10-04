import { beforeEach, describe, expect, test } from "vitest";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { Snippet } from "@/features/favorites/features/snippets/types/types";
import { SnippetStore } from "@/features/favorites/features/snippets/model/store";

const STORAGE_KEY = "searchSnippets";

let storage: MemoryLocalKeyedValues;

const persisted = (): Snippet[] => (storage.get(STORAGE_KEY) as Snippet[] | undefined) ?? [];
const getNames = (snippets: Snippet[]): string[] => snippets.map(snippet => snippet.name);
const getQueries = (snippets: Snippet[]): string[] => snippets.map(snippet => snippet.query);
const getReason = (result: { ok: boolean; reason?: string }): string | undefined => result.reason;

beforeEach(() => {
  storage = new MemoryLocalKeyedValues();
});

describe("add", () => {
  test("stores a snippet", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "( apple ~ banana )");
    expect(getNames(store.getAll())).toEqual(["fruits"]);
  });

  test("persists the snippet", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "( apple ~ banana )");
    expect(getQueries(persisted())).toEqual(["( apple ~ banana )"]);
  });

  test("returns the created snippet", () => {
    const store = new SnippetStore(storage);
    const result = store.add("fruits", "( apple ~ banana )");

    expect(result.ok).toBe(true);
    expect(result.ok && result.snippet.query).toBe("( apple ~ banana )");
  });

  test("normalizes the name", () => {
    const store = new SnippetStore(storage);

    store.add("My Fruits", "apple");
    expect(getNames(store.getAll())).toEqual(["my_fruits"]);
  });

  test("collapses extra whitespace in the query", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "(  apple   ~   banana  )");
    expect(getQueries(store.getAll())).toEqual(["( apple ~ banana )"]);
  });

  test("starts a snippet unused", () => {
    const store = new SnippetStore(storage);
    const result = store.add("fruits", "apple");

    expect(result.ok && result.snippet.lastUsedAt).toBe(0);
  });

  test("rejects an empty name", () => {
    const store = new SnippetStore(storage);

    expect(getReason(store.add("", "apple"))).toBe("empty-name");
    expect(store.getAll()).toEqual([]);
  });

  test("rejects a name of only whitespace", () => {
    const store = new SnippetStore(storage);

    expect(getReason(store.add("   ", "apple"))).toBe("empty-name");
  });

  test("rejects an empty query", () => {
    const store = new SnippetStore(storage);

    expect(getReason(store.add("fruits", ""))).toBe("empty-query");
    expect(store.getAll()).toEqual([]);
  });

  test("rejects a query of only whitespace", () => {
    const store = new SnippetStore(storage);

    expect(getReason(store.add("fruits", "   "))).toBe("empty-query");
  });

  test("rejects a duplicate name", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "apple");
    expect(getReason(store.add("fruits", "banana"))).toBe("duplicate-name");
  });

  test("leaves the original untouched when the name is a duplicate", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "apple");
    store.add("fruits", "banana");
    expect(getQueries(store.getAll())).toEqual(["apple"]);
  });

  test("treats names as duplicates after normalizing", () => {
    const store = new SnippetStore(storage);

    store.add("my_fruits", "apple");
    expect(getReason(store.add("My Fruits", "banana"))).toBe("duplicate-name");
  });
});

describe("update", () => {
  test("changes the query", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "apple");
    store.update("fruits", "fruits", "banana");
    expect(getQueries(store.getAll())).toEqual(["banana"]);
  });

  test("changes the name", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "apple");
    store.update("fruits", "fruit", "apple");
    expect(getNames(store.getAll())).toEqual(["fruit"]);
  });

  test("drops the old name when renaming", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "apple");
    store.update("fruits", "fruit", "apple");
    expect(store.getAll()).toHaveLength(1);
  });

  test("keeps the creation time", () => {
    const store = new SnippetStore(storage);
    const created = store.add("fruits", "apple");
    const createdAt = created.ok ? created.snippet.createdAt : 0;

    store.update("fruits", "fruit", "banana");
    expect(store.getAll()[0].createdAt).toBe(createdAt);
  });

  test("keeps the time of last use", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "apple");
    store.use("fruits");
    const lastUsedAt = store.getAll()[0].lastUsedAt;

    store.update("fruits", "fruit", "banana");
    expect(store.getAll()[0].lastUsedAt).toBe(lastUsedAt);
  });

  test("persists the change", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "apple");
    store.update("fruits", "fruit", "banana");
    expect(getNames(persisted())).toEqual(["fruit"]);
  });

  test("normalizes the new name", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "apple");
    store.update("fruits", "My Fruits", "apple");
    expect(getNames(store.getAll())).toEqual(["my_fruits"]);
  });

  test("rejects an unknown snippet", () => {
    const store = new SnippetStore(storage);

    expect(getReason(store.update("missing", "fruits", "apple"))).toBe("not-found");
  });

  test("does not create a snippet when the old name is unknown", () => {
    const store = new SnippetStore(storage);

    store.update("missing", "fruits", "apple");
    expect(store.getAll()).toEqual([]);
  });

  test("rejects renaming onto another snippet", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "apple");
    store.add("veg", "carrot");
    expect(getReason(store.update("fruits", "veg", "apple"))).toBe("duplicate-name");
  });

  test("leaves both snippets intact when the new name is taken", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "apple");
    store.add("veg", "carrot");
    store.update("fruits", "veg", "apple");
    expect(getQueries(store.getAll())).toEqual(["apple", "carrot"]);
  });

  test("allows keeping the same name", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "apple");
    expect(store.update("fruits", "fruits", "banana").ok).toBe(true);
  });

  test("rejects an empty new name", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "apple");
    expect(getReason(store.update("fruits", "", "apple"))).toBe("empty-name");
  });

  test("restores the snippet when the new name is empty", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "apple");
    store.update("fruits", "", "apple");
    expect(getQueries(store.getAll())).toEqual(["apple"]);
  });

  test("rejects an empty query", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "apple");
    expect(getReason(store.update("fruits", "fruits", ""))).toBe("empty-query");
  });

  test("restores the snippet when the query is empty", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "apple");
    store.update("fruits", "fruits", "");
    expect(getNames(store.getAll())).toEqual(["fruits"]);
  });
});

describe("remove", () => {
  test("deletes the snippet", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "apple");
    store.add("veg", "carrot");
    store.remove("fruits");
    expect(getNames(store.getAll())).toEqual(["veg"]);
  });

  test("persists the deletion", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "apple");
    store.remove("fruits");
    expect(persisted()).toEqual([]);
  });

  test("ignores an unknown name", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "apple");
    store.remove("missing");
    expect(store.getAll()).toHaveLength(1);
  });
});

describe("replaceAll", () => {
  test("discards the existing snippets", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "apple");
    store.replaceAll([{ name: "veg", query: "carrot" }]);
    expect(getNames(store.getAll())).toEqual(["veg"]);
  });

  test("stores every entry", () => {
    const store = new SnippetStore(storage);

    store.replaceAll([{ name: "a", query: "1" }, { name: "b", query: "2" }]);
    expect(getNames(store.getAll())).toEqual(["a", "b"]);
  });

  test("keeps the order of the imported entries", () => {
    const store = new SnippetStore(storage);

    store.replaceAll([{ name: "c", query: "3" }, { name: "a", query: "1" }, { name: "b", query: "2" }]);
    expect(getNames(store.getAll())).toEqual(["c", "a", "b"]);
  });

  test("orders imported entries by creation time", () => {
    const store = new SnippetStore(storage);

    store.replaceAll([{ name: "first", query: "1" }, { name: "second", query: "2" }]);
    expect(store.getAll()[0].createdAt).toBeGreaterThan(store.getAll()[1].createdAt);
  });

  test("returns the number of entries stored", () => {
    const store = new SnippetStore(storage);

    expect(store.replaceAll([{ name: "a", query: "1" }, { name: "b", query: "2" }])).toBe(2);
  });

  test("normalizes imported names", () => {
    const store = new SnippetStore(storage);

    store.replaceAll([{ name: "My Fruits", query: "apple" }]);
    expect(getNames(store.getAll())).toEqual(["my_fruits"]);
  });

  test("skips an entry with an empty name", () => {
    const store = new SnippetStore(storage);

    store.replaceAll([{ name: "", query: "apple" }, { name: "veg", query: "carrot" }]);
    expect(getNames(store.getAll())).toEqual(["veg"]);
  });

  test("skips an entry with an empty query", () => {
    const store = new SnippetStore(storage);

    store.replaceAll([{ name: "fruits", query: "" }, { name: "veg", query: "carrot" }]);
    expect(getNames(store.getAll())).toEqual(["veg"]);
  });

  test("keeps only the first of two entries sharing a name", () => {
    const store = new SnippetStore(storage);

    store.replaceAll([{ name: "fruits", query: "apple" }, { name: "fruits", query: "banana" }]);
    expect(getQueries(store.getAll())).toEqual(["apple"]);
  });

  test("excludes skipped entries from the count", () => {
    const store = new SnippetStore(storage);

    expect(store.replaceAll([{ name: "", query: "apple" }, { name: "veg", query: "carrot" }])).toBe(1);
  });

  test("clears the snippets when given nothing", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "apple");
    store.replaceAll([]);
    expect(store.getAll()).toEqual([]);
  });

  test("persists the replacement", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "apple");
    store.replaceAll([{ name: "veg", query: "carrot" }]);
    expect(getNames(persisted())).toEqual(["veg"]);
  });

  test("persists an empty replacement", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "apple");
    store.replaceAll([]);
    expect(persisted()).toEqual([]);
  });

  test("resets the time of last use", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "apple");
    store.use("fruits");
    store.replaceAll([{ name: "fruits", query: "apple" }]);
    expect(store.getAll()[0].lastUsedAt).toBe(0);
  });

  test("collapses whitespace in imported queries", () => {
    const store = new SnippetStore(storage);

    store.replaceAll([{ name: "fruits", query: "  apple   banana  " }]);
    expect(getQueries(store.getAll())).toEqual(["apple banana"]);
  });

  test("reloads the replacement from storage", () => {
    const store = new SnippetStore(storage);

    store.replaceAll([{ name: "veg", query: "carrot" }]);
    expect(getNames(new SnippetStore(storage).getAll())).toEqual(["veg"]);
  });
});

describe("use", () => {
  test("records the time of use", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "apple");
    store.use("fruits");
    expect(store.getAll()[0].lastUsedAt).toBeGreaterThan(0);
  });

  test("persists the time of use", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "apple");
    store.use("fruits");
    expect(persisted()[0].lastUsedAt).toBeGreaterThan(0);
  });

  test("leaves the query alone", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "apple");
    store.use("fruits");
    expect(getQueries(store.getAll())).toEqual(["apple"]);
  });

  test("ignores an unknown name", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "apple");
    store.use("missing");
    expect(store.getAll()[0].lastUsedAt).toBe(0);
  });
});

describe("moveToTop", () => {
  test("makes the snippet the newest", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "apple", 0, 100);
    store.add("veg", "carrot", 0, 200);
    store.moveToTop("fruits");
    expect(store.get("fruits")?.createdAt).toBeGreaterThan(200);
  });

  test("persists the new creation time", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "apple", 0, 100);
    store.moveToTop("fruits");
    expect(persisted()[0].createdAt).toBeGreaterThan(100);
  });

  test("leaves the query alone", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "apple");
    store.moveToTop("fruits");
    expect(getQueries(store.getAll())).toEqual(["apple"]);
  });

  test("ignores an unknown name", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "apple", 0, 100);
    store.moveToTop("missing");
    expect(store.get("fruits")?.createdAt).toBe(100);
  });
});

describe("getAll", () => {
  test("does not expose the internal collection", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "apple");
    store.getAll().pop();
    expect(store.getAll()).toHaveLength(1);
  });

  test("keeps insertion order", () => {
    const store = new SnippetStore(storage);

    store.add("a", "1");
    store.add("b", "2");
    store.add("c", "3");
    expect(getNames(store.getAll())).toEqual(["a", "b", "c"]);
  });
});

describe("loading", () => {
  test("reads snippets persisted by an earlier session", () => {
    const first = new SnippetStore(storage);

    first.add("fruits", "apple");
    expect(getNames(new SnippetStore(storage).getAll())).toEqual(["fruits"]);
  });

  test("starts empty when nothing is stored", () => {
    expect(new SnippetStore(storage).getAll()).toEqual([]);
  });

  test("drops entries that are not snippets", () => {
    storage.set(STORAGE_KEY, [{ name: "fruits", query: "apple", lastUsedAt: 0, createdAt: 0 }, { name: "x" }, "junk", null]);
    expect(getNames(new SnippetStore(storage).getAll())).toEqual(["fruits"]);
  });

  test("drops entries with an empty name", () => {
    storage.set(STORAGE_KEY, [{ name: "", query: "apple", lastUsedAt: 0, createdAt: 0 }]);
    expect(new SnippetStore(storage).getAll()).toEqual([]);
  });

  test("drops entries with an empty query", () => {
    storage.set(STORAGE_KEY, [{ name: "fruits", query: "   ", lastUsedAt: 0, createdAt: 0 }]);
    expect(new SnippetStore(storage).getAll()).toEqual([]);
  });

  test("keeps the first of two entries sharing a name", () => {
    storage.set(STORAGE_KEY, [
      { name: "fruits", query: "apple", lastUsedAt: 0, createdAt: 0 },
      { name: "fruits", query: "banana", lastUsedAt: 0, createdAt: 0 }
    ]);
    expect(getQueries(new SnippetStore(storage).getAll())).toEqual(["apple"]);
  });

  test("ignores stored data that is not an array", () => {
    storage.set(STORAGE_KEY, { snippets: [] });
    expect(new SnippetStore(storage).getAll()).toEqual([]);
  });
});
