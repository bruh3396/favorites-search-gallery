import { describe, expect, test } from "vitest";
import { KeyedStoredValue } from "@/core/utils/storage/keyed_stored_value";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/memory_local_keyed_values";
import { SearchHistory } from "@/core/utils/search_history/search_history";

function createSearchHistory(storedQueries: readonly string[] = [], limit = 25): SearchHistory {
  const submittedQueries = new KeyedStoredValue<readonly string[]>(
    { key: "submittedQueries", defaultValue: storedQueries },
    { storedValueStorage: new MemoryLocalKeyedValues() }
  );
  return new SearchHistory({ limit }, { submittedQueries });
}

describe("SearchHistory", () => {
  test("reads the queries it was given", () => {
    expect(createSearchHistory(["cat", "dog"]).submittedQueries.value).toEqual(["cat", "dog"]);
  });

  describe("record", () => {
    test("puts the newest query first", () => {
      const searchHistory = createSearchHistory();

      searchHistory.record("cat");
      searchHistory.record("dog");
      expect(searchHistory.submittedQueries.value).toEqual(["dog", "cat"]);
    });

    test("moves a repeated query to the front instead of keeping it twice", () => {
      const searchHistory = createSearchHistory(["dog", "cat", "fox"]);

      searchHistory.record("cat");
      expect(searchHistory.submittedQueries.value).toEqual(["cat", "dog", "fox"]);
    });

    test("keeps only the newest queries up to its limit", () => {
      const searchHistory = createSearchHistory(["dog", "cat"], 2);

      searchHistory.record("fox");
      expect(searchHistory.submittedQueries.value).toEqual(["fox", "dog"]);
    });

    test.each(["", "   "])("ignores the blank query %j", query => {
      const searchHistory = createSearchHistory(["cat"]);

      searchHistory.record(query);
      expect(searchHistory.submittedQueries.value).toEqual(["cat"]);
    });

    test("trims a query before comparing and storing it", () => {
      const searchHistory = createSearchHistory(["dog", "cat"]);

      searchHistory.record("  cat ");
      expect(searchHistory.submittedQueries.value).toEqual(["cat", "dog"]);
    });
  });
});
