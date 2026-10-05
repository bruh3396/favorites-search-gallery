import { describe, expect, test } from "vitest";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { MemoryLocalSnippets } from "@/adapters/memory/ports/local_snippets/local_snippets";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Snippet } from "@/core/domain/snippet/snippet";
import { SnippetStore } from "@/features/favorites/features/snippets/model/store";

const UNMOVED_STORAGE_KEY = "searchSnippets";

interface Setup {
  store: SnippetStore;
  localKeyedValues: MemoryLocalKeyedValues;
  scheduler: MemoryScheduler;
  createStore: () => SnippetStore;
  loadStore: () => Promise<SnippetStore>;
  readPersisted: () => Promise<Snippet[]>;
}

const getNames = (snippets: Snippet[]): string[] => snippets.map(snippet => snippet.name);
const getQueries = (snippets: Snippet[]): string[] => snippets.map(snippet => snippet.query);
const getReason = (result: { ok: boolean; reason?: string }): string | undefined => result.reason;

// A store over fresh storage. createStore and loadStore open more stores over the same storage, as a later session would.
function setup(): Setup {
  const localSnippets = new MemoryLocalSnippets();
  const localKeyedValues = new MemoryLocalKeyedValues();
  const scheduler = new MemoryScheduler();
  const createStore = (): SnippetStore => new SnippetStore({ localSnippets, localKeyedValues, scheduler });
  return {
    store: createStore(),
    localKeyedValues,
    scheduler,
    createStore,
    loadStore: async(): Promise<SnippetStore> => {
      const store = createStore();

      await store.load();
      return store;
    },
    readPersisted: (): Promise<Snippet[]> => localSnippets.getAll()
  };
}

describe("SnippetStore", () => {
  describe("add", () => {
    test("stores a snippet", () => {
      const { store } = setup();

      store.add("fruits", "( apple ~ banana )");
      expect(getNames(store.getAll())).toEqual(["fruits"]);
    });

    test("persists the snippet", async() => {
      const { store, readPersisted } = setup();

      store.add("fruits", "( apple ~ banana )");
      expect(getQueries(await readPersisted())).toEqual(["( apple ~ banana )"]);
    });

    test("returns the created snippet", () => {
      const { store } = setup();
      const result = store.add("fruits", "( apple ~ banana )");

      expect(result.ok).toBe(true);
      expect(result.ok && result.snippet.query).toBe("( apple ~ banana )");
    });

    test("normalizes the name", () => {
      const { store } = setup();

      store.add("My Fruits", "apple");
      expect(getNames(store.getAll())).toEqual(["my_fruits"]);
    });

    test("collapses extra whitespace in the query", () => {
      const { store } = setup();

      store.add("fruits", "(  apple   ~   banana  )");
      expect(getQueries(store.getAll())).toEqual(["( apple ~ banana )"]);
    });

    test("starts a snippet unused", () => {
      const { store } = setup();
      const result = store.add("fruits", "apple");

      expect(result.ok && result.snippet.lastUsedAt).toBe(0);
    });

    test("rejects an empty name", () => {
      const { store } = setup();

      expect(getReason(store.add("", "apple"))).toBe("empty-name");
      expect(store.getAll()).toEqual([]);
    });

    test("rejects a name of only whitespace", () => {
      const { store } = setup();

      expect(getReason(store.add("   ", "apple"))).toBe("empty-name");
    });

    test("rejects an empty query", () => {
      const { store } = setup();

      expect(getReason(store.add("fruits", ""))).toBe("empty-query");
      expect(store.getAll()).toEqual([]);
    });

    test("rejects a query of only whitespace", () => {
      const { store } = setup();

      expect(getReason(store.add("fruits", "   "))).toBe("empty-query");
    });

    test("rejects a duplicate name", () => {
      const { store } = setup();

      store.add("fruits", "apple");
      expect(getReason(store.add("fruits", "banana"))).toBe("duplicate-name");
    });

    test("leaves the original untouched when the name is a duplicate", async() => {
      const { store, readPersisted } = setup();

      store.add("fruits", "apple");
      store.add("fruits", "banana");
      expect(getQueries(store.getAll())).toEqual(["apple"]);
      expect(getQueries(await readPersisted())).toEqual(["apple"]);
    });

    test("treats names as duplicates after normalizing", () => {
      const { store } = setup();

      store.add("my_fruits", "apple");
      expect(getReason(store.add("My Fruits", "banana"))).toBe("duplicate-name");
    });
  });

  describe("update", () => {
    test("changes the query", () => {
      const { store } = setup();

      store.add("fruits", "apple");
      store.update("fruits", "fruits", "banana");
      expect(getQueries(store.getAll())).toEqual(["banana"]);
    });

    test("changes the name", () => {
      const { store } = setup();

      store.add("fruits", "apple");
      store.update("fruits", "fruit", "apple");
      expect(getNames(store.getAll())).toEqual(["fruit"]);
    });

    test("drops the old name when renaming", () => {
      const { store } = setup();

      store.add("fruits", "apple");
      store.update("fruits", "fruit", "apple");
      expect(store.getAll()).toHaveLength(1);
    });

    test("keeps the creation time", () => {
      const { store, scheduler } = setup();

      scheduler.advance(100);
      store.add("fruits", "apple");
      scheduler.advance(100);
      store.update("fruits", "fruit", "banana");
      expect(store.getAll()[0].createdAt).toBe(100);
    });

    test("keeps the time of last use", () => {
      const { store, scheduler } = setup();

      store.add("fruits", "apple");
      scheduler.advance(100);
      store.use("fruits");
      scheduler.advance(100);
      store.update("fruits", "fruit", "banana");
      expect(store.getAll()[0].lastUsedAt).toBe(100);
    });

    test("persists a rename", async() => {
      const { store, readPersisted } = setup();

      store.add("fruits", "apple");
      store.update("fruits", "fruit", "banana");
      expect(await readPersisted()).toEqual(store.getAll());
    });

    test("persists a new query under the same name", async() => {
      const { store, readPersisted } = setup();

      store.add("fruits", "apple");
      store.update("fruits", "fruits", "banana");
      expect(getQueries(await readPersisted())).toEqual(["banana"]);
    });

    test("normalizes the new name", () => {
      const { store } = setup();

      store.add("fruits", "apple");
      store.update("fruits", "My Fruits", "apple");
      expect(getNames(store.getAll())).toEqual(["my_fruits"]);
    });

    test("rejects an unknown snippet", () => {
      const { store } = setup();

      expect(getReason(store.update("missing", "fruits", "apple"))).toBe("not-found");
    });

    test("does not create a snippet when the old name is unknown", async() => {
      const { store, readPersisted } = setup();

      store.update("missing", "fruits", "apple");
      expect(store.getAll()).toEqual([]);
      expect(await readPersisted()).toEqual([]);
    });

    test("rejects renaming onto another snippet", () => {
      const { store } = setup();

      store.add("fruits", "apple");
      store.add("veg", "carrot");
      expect(getReason(store.update("fruits", "veg", "apple"))).toBe("duplicate-name");
    });

    test("leaves both snippets intact when the new name is taken", () => {
      const { store } = setup();

      store.add("fruits", "apple");
      store.add("veg", "carrot");
      store.update("fruits", "veg", "apple");
      expect(getQueries(store.getAll())).toEqual(["apple", "carrot"]);
    });

    test("allows keeping the same name", () => {
      const { store } = setup();

      store.add("fruits", "apple");
      expect(store.update("fruits", "fruits", "banana").ok).toBe(true);
    });

    test("rejects an empty new name", () => {
      const { store } = setup();

      store.add("fruits", "apple");
      expect(getReason(store.update("fruits", "", "apple"))).toBe("empty-name");
    });

    test("restores the snippet when the new name is empty", async() => {
      const { store, readPersisted } = setup();

      store.add("fruits", "apple");
      store.update("fruits", "", "apple");
      expect(getQueries(store.getAll())).toEqual(["apple"]);
      expect(getQueries(await readPersisted())).toEqual(["apple"]);
    });

    test("rejects an empty query", () => {
      const { store } = setup();

      store.add("fruits", "apple");
      expect(getReason(store.update("fruits", "fruits", ""))).toBe("empty-query");
    });

    test("restores the snippet when the query is empty", () => {
      const { store } = setup();

      store.add("fruits", "apple");
      store.update("fruits", "fruits", "");
      expect(getNames(store.getAll())).toEqual(["fruits"]);
    });
  });

  describe("remove", () => {
    test("deletes the snippet", () => {
      const { store } = setup();

      store.add("fruits", "apple");
      store.add("veg", "carrot");
      store.remove("fruits");
      expect(getNames(store.getAll())).toEqual(["veg"]);
    });

    test("persists the deletion", async() => {
      const { store, readPersisted } = setup();

      store.add("fruits", "apple");
      store.remove("fruits");
      expect(await readPersisted()).toEqual([]);
    });

    test("ignores an unknown name", () => {
      const { store } = setup();

      store.add("fruits", "apple");
      store.remove("missing");
      expect(store.getAll()).toHaveLength(1);
    });
  });

  describe("replaceAll", () => {
    test("discards the existing snippets", () => {
      const { store } = setup();

      store.add("fruits", "apple");
      store.replaceAll([{ name: "veg", query: "carrot" }]);
      expect(getNames(store.getAll())).toEqual(["veg"]);
    });

    test("stores every entry", () => {
      const { store } = setup();

      store.replaceAll([{ name: "a", query: "1" }, { name: "b", query: "2" }]);
      expect(getNames(store.getAll())).toEqual(["a", "b"]);
    });

    test("keeps the order of the imported entries", () => {
      const { store } = setup();

      store.replaceAll([{ name: "c", query: "3" }, { name: "a", query: "1" }, { name: "b", query: "2" }]);
      expect(getNames(store.getAll())).toEqual(["c", "a", "b"]);
    });

    test("orders imported entries by creation time", () => {
      const { store } = setup();

      store.replaceAll([{ name: "first", query: "1" }, { name: "second", query: "2" }]);
      expect(store.getAll()[0].createdAt).toBeGreaterThan(store.getAll()[1].createdAt);
    });

    test("returns the number of entries stored", () => {
      const { store } = setup();

      expect(store.replaceAll([{ name: "a", query: "1" }, { name: "b", query: "2" }])).toBe(2);
    });

    test("normalizes imported names", () => {
      const { store } = setup();

      store.replaceAll([{ name: "My Fruits", query: "apple" }]);
      expect(getNames(store.getAll())).toEqual(["my_fruits"]);
    });

    test("skips an entry with an empty name", () => {
      const { store } = setup();

      store.replaceAll([{ name: "", query: "apple" }, { name: "veg", query: "carrot" }]);
      expect(getNames(store.getAll())).toEqual(["veg"]);
    });

    test("skips an entry with an empty query", () => {
      const { store } = setup();

      store.replaceAll([{ name: "fruits", query: "" }, { name: "veg", query: "carrot" }]);
      expect(getNames(store.getAll())).toEqual(["veg"]);
    });

    test("keeps only the first of two entries sharing a name", () => {
      const { store } = setup();

      store.replaceAll([{ name: "fruits", query: "apple" }, { name: "fruits", query: "banana" }]);
      expect(getQueries(store.getAll())).toEqual(["apple"]);
    });

    test("excludes skipped entries from the count", () => {
      const { store } = setup();

      expect(store.replaceAll([{ name: "", query: "apple" }, { name: "veg", query: "carrot" }])).toBe(1);
    });

    test("clears the snippets when given nothing", () => {
      const { store } = setup();

      store.add("fruits", "apple");
      store.replaceAll([]);
      expect(store.getAll()).toEqual([]);
    });

    test("persists the replacement", async() => {
      const { store, readPersisted } = setup();

      store.add("fruits", "apple");
      store.replaceAll([{ name: "veg", query: "carrot" }]);
      expect(getNames(await readPersisted())).toEqual(["veg"]);
    });

    test("persists an empty replacement", async() => {
      const { store, readPersisted } = setup();

      store.add("fruits", "apple");
      store.replaceAll([]);
      expect(await readPersisted()).toEqual([]);
    });

    test("resets the time of last use", () => {
      const { store, scheduler } = setup();

      store.add("fruits", "apple");
      scheduler.advance(100);
      store.use("fruits");
      store.replaceAll([{ name: "fruits", query: "apple" }]);
      expect(store.getAll()[0].lastUsedAt).toBe(0);
    });

    test("collapses whitespace in imported queries", () => {
      const { store } = setup();

      store.replaceAll([{ name: "fruits", query: "  apple   banana  " }]);
      expect(getQueries(store.getAll())).toEqual(["apple banana"]);
    });

    test("reloads the replacement from storage", async() => {
      const { store, loadStore } = setup();

      store.replaceAll([{ name: "veg", query: "carrot" }]);
      expect(getNames((await loadStore()).getAll())).toEqual(["veg"]);
    });
  });

  describe("use", () => {
    test("records the time of use", () => {
      const { store, scheduler } = setup();

      store.add("fruits", "apple");
      scheduler.advance(100);
      store.use("fruits");
      expect(store.getAll()[0].lastUsedAt).toBe(100);
    });

    test("persists the time of use", async() => {
      const { store, scheduler, readPersisted } = setup();

      store.add("fruits", "apple");
      scheduler.advance(100);
      store.use("fruits");
      expect((await readPersisted())[0].lastUsedAt).toBe(100);
    });

    test("leaves the query alone", () => {
      const { store } = setup();

      store.add("fruits", "apple");
      store.use("fruits");
      expect(getQueries(store.getAll())).toEqual(["apple"]);
    });

    test("ignores an unknown name", () => {
      const { store } = setup();

      store.add("fruits", "apple");
      store.use("missing");
      expect(store.getAll()[0].lastUsedAt).toBe(0);
    });
  });

  describe("moveToTop", () => {
    test("makes the snippet the newest", () => {
      const { store, scheduler } = setup();

      scheduler.advance(100);
      store.add("fruits", "apple");
      scheduler.advance(100);
      store.add("veg", "carrot");
      scheduler.advance(100);
      store.moveToTop("fruits");
      expect(store.get("fruits")?.createdAt).toBe(300);
    });

    test("persists the new creation time", async() => {
      const { store, scheduler, readPersisted } = setup();

      scheduler.advance(100);
      store.add("fruits", "apple");
      scheduler.advance(100);
      store.moveToTop("fruits");
      expect((await readPersisted())[0].createdAt).toBe(200);
    });

    test("leaves the query alone", () => {
      const { store } = setup();

      store.add("fruits", "apple");
      store.moveToTop("fruits");
      expect(getQueries(store.getAll())).toEqual(["apple"]);
    });

    test("ignores an unknown name", () => {
      const { store, scheduler } = setup();

      scheduler.advance(100);
      store.add("fruits", "apple");
      scheduler.advance(100);
      store.moveToTop("missing");
      expect(store.get("fruits")?.createdAt).toBe(100);
    });
  });

  describe("getAll", () => {
    test("does not expose the internal collection", () => {
      const { store } = setup();

      store.add("fruits", "apple");
      store.getAll().pop();
      expect(store.getAll()).toHaveLength(1);
    });

    test("keeps insertion order", () => {
      const { store } = setup();

      store.add("a", "1");
      store.add("b", "2");
      store.add("c", "3");
      expect(getNames(store.getAll())).toEqual(["a", "b", "c"]);
    });
  });

  describe("load", () => {
    test("reads snippets persisted by an earlier session", async() => {
      const { createStore, loadStore } = setup();

      createStore().add("fruits", "apple");

      expect(getNames((await loadStore()).getAll())).toEqual(["fruits"]);
    });

    test("starts empty when nothing is stored", async() => {
      const { loadStore } = setup();

      expect((await loadStore()).getAll()).toEqual([]);
    });

    test("keeps a snippet added before loading finished", async() => {
      const { createStore } = setup();

      createStore().add("fruits", "apple");
      const store = createStore();
      const loading = store.load();

      store.add("veg", "carrot");
      await loading;

      expect(getNames(store.getAll()).sort()).toEqual(["fruits", "veg"]);
    });

    test("keeps the newer copy of a snippet changed before loading finished", async() => {
      const { createStore } = setup();

      createStore().add("fruits", "apple");
      const store = createStore();
      const loading = store.load();

      store.replaceAll([{ name: "fruits", query: "banana" }]);
      await loading;

      expect(getQueries(store.getAll())).toEqual(["banana"]);
    });

    test("moves snippets out of local storage into local snippets", async() => {
      const { localKeyedValues, loadStore, readPersisted } = setup();

      localKeyedValues.set(UNMOVED_STORAGE_KEY, [{ name: "fruits", query: "apple", lastUsedAt: 5, createdAt: 9 }]);

      expect((await loadStore()).getAll()).toEqual([{ name: "fruits", query: "apple", lastUsedAt: 5, createdAt: 9 }]);
      expect(getNames(await readPersisted())).toEqual(["fruits"]);
      expect(localKeyedValues.get(UNMOVED_STORAGE_KEY)).toBeUndefined();
    });

    test("leaves snippets in local storage once local snippets has some", async() => {
      const { localKeyedValues, createStore, loadStore } = setup();

      createStore().add("veg", "carrot");
      localKeyedValues.set(UNMOVED_STORAGE_KEY, [{ name: "fruits", query: "apple", lastUsedAt: 0, createdAt: 0 }]);

      expect(getNames((await loadStore()).getAll())).toEqual(["veg"]);
      expect(localKeyedValues.get(UNMOVED_STORAGE_KEY)).toBeDefined();
    });

    test("drops local storage entries that are not snippets", async() => {
      const { localKeyedValues, loadStore } = setup();

      localKeyedValues.set(UNMOVED_STORAGE_KEY, [{ name: "fruits", query: "apple", lastUsedAt: 0, createdAt: 0 }, { name: "x" }, "junk", null]);

      expect(getNames((await loadStore()).getAll())).toEqual(["fruits"]);
    });

    test("drops local storage entries with an empty name", async() => {
      const { localKeyedValues, loadStore } = setup();

      localKeyedValues.set(UNMOVED_STORAGE_KEY, [{ name: "", query: "apple", lastUsedAt: 0, createdAt: 0 }]);

      expect((await loadStore()).getAll()).toEqual([]);
    });

    test("drops local storage entries with an empty query", async() => {
      const { localKeyedValues, loadStore } = setup();

      localKeyedValues.set(UNMOVED_STORAGE_KEY, [{ name: "fruits", query: "   ", lastUsedAt: 0, createdAt: 0 }]);

      expect((await loadStore()).getAll()).toEqual([]);
    });

    test("keeps the first of two local storage entries sharing a name", async() => {
      const { localKeyedValues, loadStore } = setup();

      localKeyedValues.set(UNMOVED_STORAGE_KEY, [
        { name: "fruits", query: "apple", lastUsedAt: 0, createdAt: 0 },
        { name: "fruits", query: "banana", lastUsedAt: 0, createdAt: 0 }
      ]);

      expect(getQueries((await loadStore()).getAll())).toEqual(["apple"]);
    });

    test("ignores local storage data that is not an array", async() => {
      const { localKeyedValues, loadStore } = setup();

      localKeyedValues.set(UNMOVED_STORAGE_KEY, { snippets: [] });

      expect((await loadStore()).getAll()).toEqual([]);
    });
  });
});
