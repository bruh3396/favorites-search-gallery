import { SnippetStore, normalizeName } from "@/features/favorites/features/snippets/store";
import { beforeEach, describe, expect, test } from "vitest";
import { Snippet } from "@/features/favorites/features/snippets/types";
import { Store } from "@/lib/storage/local_storage";

const STORAGE_KEY = "searchSnippets";
const LEGACY_STORAGE_KEY = "savedSearches";

class FakeStorage implements Store {
  private readonly values = new Map<string, unknown>();

  public get<V>(key: string): V | null {
    return this.values.has(key) ? this.values.get(key) as V : null;
  }

  public set<V>(key: string, value: V): void {
    this.values.set(key, JSON.parse(JSON.stringify(value)) as unknown);
  }

  public remove(key: string): void {
    this.values.delete(key);
  }

  public keys(): string[] {
    return Array.from(this.values.keys());
  }

  public clear(): void {
    this.values.clear();
  }
}

let storage: FakeStorage;

const persisted = (): Snippet[] => storage.get<Snippet[]>(STORAGE_KEY) ?? [];
const namesOf = (snippets: Snippet[]): string[] => snippets.map(snippet => snippet.name);
const queriesOf = (snippets: Snippet[]): string[] => snippets.map(snippet => snippet.query);
const reasonOf = (result: { ok: boolean; reason?: string }): string | undefined => result.reason;

beforeEach(() => {
  storage = new FakeStorage();
});

describe("normalizeName", () => {
  test("lowercases", () => {
    expect(normalizeName("Fruits")).toBe("fruits");
  });

  test("replaces spaces with underscores", () => {
    expect(normalizeName("my fruits")).toBe("my_fruits");
  });

  test("collapses repeated whitespace before replacing", () => {
    expect(normalizeName("  my   fruits  ")).toBe("my_fruits");
  });

  test("leaves an already normalized name alone", () => {
    expect(normalizeName("my_fruits")).toBe("my_fruits");
  });

  test("maps names differing only by case and spacing onto one handle", () => {
    expect(normalizeName("My Fruits")).toBe(normalizeName("my_fruits"));
  });
});

describe("add", () => {
  test("stores a snippet", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "( apple ~ banana )");
    expect(namesOf(store.getAll())).toEqual(["fruits"]);
  });

  test("persists the snippet", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "( apple ~ banana )");
    expect(queriesOf(persisted())).toEqual(["( apple ~ banana )"]);
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
    expect(namesOf(store.getAll())).toEqual(["my_fruits"]);
  });

  test("collapses extra whitespace in the query", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "(  apple   ~   banana  )");
    expect(queriesOf(store.getAll())).toEqual(["( apple ~ banana )"]);
  });

  test("starts a snippet unused", () => {
    const store = new SnippetStore(storage);
    const result = store.add("fruits", "apple");

    expect(result.ok && result.snippet.lastUsedAt).toBe(0);
  });

  test("rejects an empty name", () => {
    const store = new SnippetStore(storage);

    expect(reasonOf(store.add("", "apple"))).toBe("empty-name");
    expect(store.getAll()).toEqual([]);
  });

  test("rejects a name of only whitespace", () => {
    const store = new SnippetStore(storage);

    expect(reasonOf(store.add("   ", "apple"))).toBe("empty-name");
  });

  test("rejects an empty query", () => {
    const store = new SnippetStore(storage);

    expect(reasonOf(store.add("fruits", ""))).toBe("empty-query");
    expect(store.getAll()).toEqual([]);
  });

  test("rejects a query of only whitespace", () => {
    const store = new SnippetStore(storage);

    expect(reasonOf(store.add("fruits", "   "))).toBe("empty-query");
  });

  test("rejects a duplicate name", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "apple");
    expect(reasonOf(store.add("fruits", "banana"))).toBe("duplicate-name");
  });

  test("leaves the original untouched when the name is a duplicate", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "apple");
    store.add("fruits", "banana");
    expect(queriesOf(store.getAll())).toEqual(["apple"]);
  });

  test("treats names as duplicates after normalizing", () => {
    const store = new SnippetStore(storage);

    store.add("my_fruits", "apple");
    expect(reasonOf(store.add("My Fruits", "banana"))).toBe("duplicate-name");
  });
});

describe("update", () => {
  test("changes the query", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "apple");
    store.update("fruits", "fruits", "banana");
    expect(queriesOf(store.getAll())).toEqual(["banana"]);
  });

  test("changes the name", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "apple");
    store.update("fruits", "fruit", "apple");
    expect(namesOf(store.getAll())).toEqual(["fruit"]);
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
    expect(namesOf(persisted())).toEqual(["fruit"]);
  });

  test("normalizes the new name", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "apple");
    store.update("fruits", "My Fruits", "apple");
    expect(namesOf(store.getAll())).toEqual(["my_fruits"]);
  });

  test("rejects an unknown snippet", () => {
    const store = new SnippetStore(storage);

    expect(reasonOf(store.update("missing", "fruits", "apple"))).toBe("not-found");
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
    expect(reasonOf(store.update("fruits", "veg", "apple"))).toBe("duplicate-name");
  });

  test("leaves both snippets intact when the new name is taken", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "apple");
    store.add("veg", "carrot");
    store.update("fruits", "veg", "apple");
    expect(queriesOf(store.getAll())).toEqual(["apple", "carrot"]);
  });

  test("allows keeping the same name", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "apple");
    expect(store.update("fruits", "fruits", "banana").ok).toBe(true);
  });

  test("rejects an empty new name", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "apple");
    expect(reasonOf(store.update("fruits", "", "apple"))).toBe("empty-name");
  });

  test("restores the snippet when the new name is empty", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "apple");
    store.update("fruits", "", "apple");
    expect(queriesOf(store.getAll())).toEqual(["apple"]);
  });

  test("rejects an empty query", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "apple");
    expect(reasonOf(store.update("fruits", "fruits", ""))).toBe("empty-query");
  });

  test("restores the snippet when the query is empty", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "apple");
    store.update("fruits", "fruits", "");
    expect(namesOf(store.getAll())).toEqual(["fruits"]);
  });
});

describe("remove", () => {
  test("deletes the snippet", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "apple");
    store.add("veg", "carrot");
    store.remove("fruits");
    expect(namesOf(store.getAll())).toEqual(["veg"]);
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
    expect(queriesOf(store.getAll())).toEqual(["apple"]);
  });

  test("ignores an unknown name", () => {
    const store = new SnippetStore(storage);

    store.add("fruits", "apple");
    store.use("missing");
    expect(store.getAll()[0].lastUsedAt).toBe(0);
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
    expect(namesOf(store.getAll())).toEqual(["a", "b", "c"]);
  });
});

describe("loading", () => {
  test("reads snippets persisted by an earlier session", () => {
    const first = new SnippetStore(storage);

    first.add("fruits", "apple");
    expect(namesOf(new SnippetStore(storage).getAll())).toEqual(["fruits"]);
  });

  test("starts empty when nothing is stored", () => {
    expect(new SnippetStore(storage).getAll()).toEqual([]);
  });

  test("drops entries that are not snippets", () => {
    storage.set(STORAGE_KEY, [{ name: "fruits", query: "apple", lastUsedAt: 0, createdAt: 0 }, { name: "x" }, "junk", null]);
    expect(namesOf(new SnippetStore(storage).getAll())).toEqual(["fruits"]);
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
    expect(queriesOf(new SnippetStore(storage).getAll())).toEqual(["apple"]);
  });

  test("ignores stored data that is not an array", () => {
    storage.set(STORAGE_KEY, { snippets: [] });
    expect(new SnippetStore(storage).getAll()).toEqual([]);
  });
});

describe("legacy migration", () => {
  test("converts legacy queries", () => {
    storage.set(LEGACY_STORAGE_KEY, ["apple", "carrot"]);
    expect(queriesOf(new SnippetStore(storage).getAll())).toEqual(["apple", "carrot"]);
  });

  test("generates a name for every entry", () => {
    storage.set(LEGACY_STORAGE_KEY, ["apple", "carrot"]);
    expect(namesOf(new SnippetStore(storage).getAll())).toEqual(["snippet_1", "snippet_2"]);
  });

  test("preserves the legacy order through creation time", () => {
    storage.set(LEGACY_STORAGE_KEY, ["first", "second", "third"]);
    const migrated = new SnippetStore(storage).getAll();

    expect(migrated[0].createdAt).toBeGreaterThan(migrated[1].createdAt);
    expect(migrated[1].createdAt).toBeGreaterThan(migrated[2].createdAt);
  });

  test("leaves migrated snippets unused", () => {
    storage.set(LEGACY_STORAGE_KEY, ["apple"]);
    expect(new SnippetStore(storage).getAll()[0].lastUsedAt).toBe(0);
  });

  test("persists the migrated snippets", () => {
    storage.set(LEGACY_STORAGE_KEY, ["apple"]);
    new SnippetStore(storage);
    expect(queriesOf(persisted())).toEqual(["apple"]);
  });

  test("leaves the legacy data in place", () => {
    storage.set(LEGACY_STORAGE_KEY, ["apple"]);
    new SnippetStore(storage);
    expect(storage.get<string[]>(LEGACY_STORAGE_KEY)).toEqual(["apple"]);
  });

  test("does not migrate once snippets are stored", () => {
    storage.set(LEGACY_STORAGE_KEY, ["apple"]);
    storage.set(STORAGE_KEY, []);
    expect(new SnippetStore(storage).getAll()).toEqual([]);
  });

  test("skips legacy entries that are not strings", () => {
    storage.set(LEGACY_STORAGE_KEY, ["apple", 42, null, { query: "x" }]);
    expect(queriesOf(new SnippetStore(storage).getAll())).toEqual(["apple"]);
  });

  test("skips empty legacy entries", () => {
    storage.set(LEGACY_STORAGE_KEY, ["apple", "", "   "]);
    expect(queriesOf(new SnippetStore(storage).getAll())).toEqual(["apple"]);
  });

  test("collapses whitespace in legacy entries", () => {
    storage.set(LEGACY_STORAGE_KEY, ["(  apple   ~   banana  )"]);
    expect(queriesOf(new SnippetStore(storage).getAll())).toEqual(["( apple ~ banana )"]);
  });

  test("writes nothing when the legacy data holds no usable entries", () => {
    storage.set(LEGACY_STORAGE_KEY, ["", "  "]);
    new SnippetStore(storage);
    expect(storage.get(STORAGE_KEY)).toBeNull();
  });

  test("ignores legacy data that is not an array", () => {
    storage.set(LEGACY_STORAGE_KEY, "apple");
    expect(new SnippetStore(storage).getAll()).toEqual([]);
  });

  test("keeps every entry when queries repeat", () => {
    storage.set(LEGACY_STORAGE_KEY, ["apple", "apple"]);
    expect(namesOf(new SnippetStore(storage).getAll())).toEqual(["snippet_1", "snippet_2"]);
  });
});
