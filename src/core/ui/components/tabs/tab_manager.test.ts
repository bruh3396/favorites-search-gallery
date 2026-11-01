import { describe, expect, test, vi } from "vitest";
import { TabManager } from "@/core/ui/components/tabs/tab_manager";

describe("TabManager", () => {
  test("starts with no tabs", () => {
    const tabManager = new TabManager<string>({ dispose: vi.fn() });

    expect(tabManager.tabs.value).toEqual([]);
    expect(tabManager.activeTabId.value).toBeNull();
  });

  describe("open", () => {
    test("adds tabs in the order they are opened", () => {
      const tabManager = new TabManager<string>({ dispose: vi.fn() });

      tabManager.open("first", "search one");
      tabManager.open("second", "search two");

      expect(tabManager.tabs.value).toEqual([
        { id: "first", value: "search one", closable: true },
        { id: "second", value: "search two", closable: true }
      ]);
    });

    test("returns the tab it opened", () => {
      const tabManager = new TabManager<string>({ dispose: vi.fn() });

      expect(tabManager.open("first", "search one", { closable: false })).toEqual({ id: "first", value: "search one", closable: false });
    });

    test("rejects a duplicate ID without replacing or disposing the existing tab", () => {
      const dispose = vi.fn();
      const tabManager = new TabManager<string>({ dispose });

      tabManager.open("first", "original");

      expect(() => tabManager.open("first", "replacement")).toThrow("Tab already exists: first");
      expect(tabManager.tabs.value).toEqual([{ id: "first", value: "original", closable: true }]);
      expect(dispose).not.toHaveBeenCalled();
    });

    test("activates only the first tab opened", () => {
      const tabManager = new TabManager<string>({ dispose: vi.fn() });

      tabManager.open("first", "search one");
      tabManager.open("second", "search two");

      expect(tabManager.activeTabId.value).toBe("first");
    });
  });

  describe("activate", () => {
    test("activates an open tab", () => {
      const tabManager = new TabManager<string>({ dispose: vi.fn() });

      tabManager.open("first", "search one");
      tabManager.open("second", "search two");
      tabManager.activate("second");

      expect(tabManager.activeTabId.value).toBe("second");
    });

    test("ignores an unknown ID", () => {
      const tabManager = new TabManager<string>({ dispose: vi.fn() });

      tabManager.open("first", "search one");
      tabManager.activate("missing");

      expect(tabManager.activeTabId.value).toBe("first");
    });
  });

  describe("move", () => {
    test("moves a tab to the given position", () => {
      const tabManager = new TabManager<string>({ dispose: vi.fn() });

      tabManager.open("first", "search one");
      tabManager.open("second", "search two");
      tabManager.open("third", "search three");
      tabManager.move("first", 2);
      tabManager.move("third", 0);

      expect(tabManager.tabs.value.map(tab => tab.id)).toEqual(["third", "second", "first"]);
    });

    test("keeps the active tab", () => {
      const tabManager = new TabManager<string>({ dispose: vi.fn() });

      tabManager.open("first", "search one");
      tabManager.open("second", "search two");
      tabManager.move("first", 1);

      expect(tabManager.activeTabId.value).toBe("first");
    });

    test("leaves the tabs alone for an unknown ID or an unchanged position", () => {
      const tabManager = new TabManager<string>({ dispose: vi.fn() });

      tabManager.open("first", "search one");
      tabManager.open("second", "search two");
      const tabs = tabManager.tabs.peek();

      tabManager.move("missing", 0);
      tabManager.move("second", 1);

      expect(tabManager.tabs.value).toBe(tabs);
    });
  });

  describe("close", () => {
    test("activates the right neighbour when the active tab closes", () => {
      const tabManager = new TabManager<string>({ dispose: vi.fn() });

      tabManager.open("first", "search one");
      tabManager.open("second", "search two");
      tabManager.open("third", "search three");
      tabManager.activate("second");
      tabManager.close("second");

      expect(tabManager.activeTabId.value).toBe("third");
    });

    test("activates the left neighbour when the active tab closes last in line", () => {
      const tabManager = new TabManager<string>({ dispose: vi.fn() });

      tabManager.open("first", "search one");
      tabManager.open("second", "search two");
      tabManager.activate("second");
      tabManager.close("second");

      expect(tabManager.activeTabId.value).toBe("first");
    });

    test("keeps the active tab when another tab closes", () => {
      const tabManager = new TabManager<string>({ dispose: vi.fn() });

      tabManager.open("first", "search one");
      tabManager.open("second", "search two");
      tabManager.close("second");

      expect(tabManager.activeTabId.value).toBe("first");
    });

    test("clears the active tab when the last tab closes", () => {
      const tabManager = new TabManager<string>({ dispose: vi.fn() });

      tabManager.open("first", "search one");
      tabManager.close("first");

      expect(tabManager.activeTabId.value).toBeNull();
    });

    test("removes the selected tab and disposes its value once", () => {
      const dispose = vi.fn();
      const tabManager = new TabManager<string>({ dispose });

      tabManager.open("first", "search one");
      tabManager.open("second", "search two");
      tabManager.close("first");

      expect(tabManager.tabs.value).toEqual([{ id: "second", value: "search two", closable: true }]);
      expect(dispose).toHaveBeenCalledExactlyOnceWith("search one");

      tabManager.close("first");
      expect(dispose).toHaveBeenCalledOnce();
    });

    test("leaves the tabs and values alone for an unknown ID", () => {
      const dispose = vi.fn();
      const tabManager = new TabManager<string>({ dispose });

      tabManager.open("first", "search one");
      const tabs = tabManager.tabs.peek();

      tabManager.close("missing");

      expect(tabManager.tabs.value).toBe(tabs);
      expect(dispose).not.toHaveBeenCalled();
    });

    test("allows an ID to be reused after its tab closes", () => {
      const tabManager = new TabManager<string>({ dispose: vi.fn() });

      tabManager.open("first", "old search");
      tabManager.close("first");
      tabManager.open("first", "new search");

      expect(tabManager.tabs.value).toEqual([{ id: "first", value: "new search", closable: true }]);
    });

    test("keeps a tab opened as not closable", () => {
      const dispose = vi.fn();
      const tabManager = new TabManager<string>({ dispose });

      tabManager.open("home", "all favorites", { closable: false });
      const tabs = tabManager.tabs.peek();

      tabManager.close("home");

      expect(tabManager.tabs.value).toBe(tabs);
      expect(dispose).not.toHaveBeenCalled();
    });
  });
});
