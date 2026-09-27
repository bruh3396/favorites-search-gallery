import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { FavoritesSearchHistory } from "@/features/favorites/control/toolbar/search_history";
import { KeyValueStorage } from "@/features/favorites/types/types";

class FakeStorage implements KeyValueStorage {
  public readonly values = new Map<string, unknown>();

  public get<V>(key: string): V | null {
    return (this.values.get(key) ?? null) as V | null;
  }

  public set<V>(key: string, value: V): void {
    this.values.set(key, value);
  }
}

interface Stored {
  history?: string[];
  lastQuery?: string;
}

interface Setup {
  history: FavoritesSearchHistory;
  storage: FakeStorage;
}

function setup(stored: Stored = {}, depth = 30): Setup {
  const storage = new FakeStorage();

  if (stored.history !== undefined) {
    storage.set("searchHistory", stored.history);
  }

  if (stored.lastQuery !== undefined) {
    storage.set("lastEditedSearchQuery", stored.lastQuery);
  }
  return { history: new FavoritesSearchHistory(depth, storage), storage };
}

function navigate(history: FavoritesSearchHistory, ...directions: ("ArrowUp" | "ArrowDown")[]): string[] {
  return directions.map(direction => {
    history.navigate(direction);
    return history.selectedQuery;
  });
}

describe("FavoritesSearchHistory", () => {
  test("starts empty when nothing is stored", () => {
    const { history } = setup();

    expect(history.lastEditedQuery).toBe("");
    expect(navigate(history, "ArrowUp")).toEqual([""]);
  });

  test("restores the last edited query and past searches from storage", () => {
    const { history } = setup({ history: ["b", "a"], lastQuery: "draft" });

    expect(history.lastEditedQuery).toBe("draft");
    expect(history.selectedQuery).toBe("draft");
    expect(navigate(history, "ArrowUp", "ArrowUp")).toEqual(["b", "a"]);
  });

  test("walks back through searches, stops at the oldest, and returns to the draft", () => {
    const { history } = setup({ history: ["b", "a"], lastQuery: "draft" });

    expect(navigate(history, "ArrowUp", "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowDown")).toEqual(["b", "a", "a", "b", "draft", "draft"]);
  });

  test("skips a past search identical to what is already shown", () => {
    const { history } = setup({ history: ["b", "a"] });

    history.add("c");

    expect(navigate(history, "ArrowUp")).toEqual(["b"]);
  });

  test("records a search as the newest, without duplicates, and persists it", () => {
    const { history, storage } = setup({ history: ["b", "a"] });

    history.add("a");

    expect(storage.get("searchHistory")).toEqual(["a", "b"]);
    expect(storage.get("lastEditedSearchQuery")).toBe("a");
  });

  test("collapses extra whitespace in recorded searches", () => {
    const { history, storage } = setup();

    history.add("  cat   dog ");

    expect(storage.get("searchHistory")).toEqual(["cat dog"]);
  });

  test("keeps only the most recent searches up to its depth", () => {
    const { history, storage } = setup({ history: ["b", "a"] }, 2);

    history.add("c");

    expect(storage.get("searchHistory")).toEqual(["c", "b"]);
  });

  test("does not record an empty search, but still clears the draft", () => {
    const { history, storage } = setup({ history: ["a"], lastQuery: "draft" });

    history.add("");

    expect(storage.get("searchHistory")).toEqual(["a"]);
    expect(history.lastEditedQuery).toBe("");
  });

  test("editing the draft persists it and restarts navigation from the draft", () => {
    const { history, storage } = setup({ history: ["b", "a"] });

    navigate(history, "ArrowUp", "ArrowUp");
    history.setLastQuery("typed");

    expect(storage.get("lastEditedSearchQuery")).toBe("typed");
    expect(history.selectedQuery).toBe("typed");
    expect(navigate(history, "ArrowUp")).toEqual(["b"]);
  });

  describe("while typing", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    test("the draft is current immediately, even before it is persisted", () => {
      const { history } = setup({ history: ["b", "a"] });

      history.editLastQuery("d");
      history.editLastQuery("dr");

      expect(history.lastEditedQuery).toBe("dr");
      expect(navigate(history, "ArrowUp", "ArrowDown")).toEqual(["b", "dr"]);
    });

    test("persists the first keystroke at once and the latest once typing pauses", () => {
      const { history, storage } = setup();

      history.editLastQuery("d");
      expect(storage.get("lastEditedSearchQuery")).toBe("d");

      history.editLastQuery("dr");
      history.editLastQuery("dra");
      expect(storage.get("lastEditedSearchQuery")).toBe("d");

      vi.runAllTimers();
      expect(storage.get("lastEditedSearchQuery")).toBe("dra");
    });

    test("a late persist does not overwrite navigation with a stale draft", () => {
      const { history, storage } = setup({ history: ["b", "a"] });

      history.editLastQuery("d");
      history.editLastQuery("dr");
      history.navigate("ArrowUp");
      vi.runAllTimers();

      expect(storage.get("lastEditedSearchQuery")).toBe("dr");
      expect(history.selectedQuery).toBe("b");
    });
  });
});
