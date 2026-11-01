import { describe, expect, test } from "vitest";
import { HistoryNavigator } from "@/core/ui/components/search_box/history_navigator";
import { Signal } from "@/core/utils/reactive/signal";

function createHistoryNavigator(submittedQueries: readonly string[] = ["dog", "cat"]): HistoryNavigator {
  return new HistoryNavigator({ submittedQueries: new Signal(submittedQueries) });
}

describe("HistoryNavigator", () => {
  describe("recallOlder", () => {
    test("returns the newest query first, then each older one", () => {
      const historyNavigator = createHistoryNavigator();

      expect([historyNavigator.recallOlder("fox"), historyNavigator.recallOlder("dog")]).toEqual(["dog", "cat"]);
    });

    test("returns nothing past the oldest query", () => {
      const historyNavigator = createHistoryNavigator();

      historyNavigator.recallOlder("");
      historyNavigator.recallOlder("dog");
      expect(historyNavigator.recallOlder("cat")).toBeUndefined();
    });

    test("returns nothing without queries", () => {
      expect(createHistoryNavigator([]).recallOlder("fox")).toBeUndefined();
    });

    test("reads the queries as they are when browsing starts", () => {
      const submittedQueries = new Signal<readonly string[]>(["dog"]);
      const historyNavigator = new HistoryNavigator({ submittedQueries });

      submittedQueries.value = ["cat", "dog"];
      expect(historyNavigator.recallOlder("")).toBe("cat");
    });

    test("skips the query matching the typed text", () => {
      const historyNavigator = createHistoryNavigator(["cherry", "banana", "apple"]);

      expect([historyNavigator.recallOlder("cherry"), historyNavigator.recallOlder("banana")]).toEqual(["banana", "apple"]);
    });

    test("skips the query matching the typed text between other queries", () => {
      const historyNavigator = createHistoryNavigator(["cherry", "banana", "apple"]);

      expect([historyNavigator.recallOlder("banana"), historyNavigator.recallOlder("cherry")]).toEqual(["cherry", "apple"]);
    });

    test("returns nothing when the only query matches the typed text", () => {
      expect(createHistoryNavigator(["cherry"]).recallOlder("cherry")).toBeUndefined();
    });
  });

  describe("recallNewer", () => {
    test("returns each newer query, then the text typed before browsing", () => {
      const historyNavigator = createHistoryNavigator();

      historyNavigator.recallOlder("fox");
      historyNavigator.recallOlder("dog");
      expect([historyNavigator.recallNewer(), historyNavigator.recallNewer()]).toEqual(["dog", "fox"]);
    });

    test("skips the query matching the typed text on the way back to it", () => {
      const historyNavigator = createHistoryNavigator(["cherry", "banana", "apple"]);

      historyNavigator.recallOlder("banana");
      historyNavigator.recallOlder("cherry");
      expect([historyNavigator.recallNewer(), historyNavigator.recallNewer()]).toEqual(["cherry", "banana"]);
    });

    test("returns nothing while not recalling", () => {
      const historyNavigator = createHistoryNavigator();

      expect(historyNavigator.recallNewer()).toBeUndefined();
      historyNavigator.recallOlder("fox");
      historyNavigator.recallNewer();
      expect(historyNavigator.recallNewer()).toBeUndefined();
    });
  });

  describe("stopRecalling", () => {
    test("starts the next browse from the newest query and keeps the newly typed text", () => {
      const historyNavigator = createHistoryNavigator();

      historyNavigator.recallOlder("fox");
      historyNavigator.recallOlder("dog");
      historyNavigator.stopRecalling();
      expect(historyNavigator.recallOlder("owl")).toBe("dog");
      expect(historyNavigator.recallNewer()).toBe("owl");
    });
  });
});
