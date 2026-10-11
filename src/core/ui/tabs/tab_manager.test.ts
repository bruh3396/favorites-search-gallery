import { describe, expect, test, vi } from "vitest";
import { TabManager } from "@/core/ui/tabs/tab_manager";

describe("TabManager", () => {
  test("starts with no tabs", () => {
    const manager = new TabManager<string>({ dispose: vi.fn() });

    expect(manager.tabs.value).toEqual([]);
  });

  describe("open", () => {
    test("adds tabs in the order they are opened", () => {
      const manager = new TabManager<string>({ dispose: vi.fn() });

      manager.open("first", "search one");
      manager.open("second", "search two");

      expect(manager.tabs.value).toEqual([
        { id: "first", value: "search one" },
        { id: "second", value: "search two" }
      ]);
    });

    test("rejects a duplicate ID without replacing or disposing the existing tab", () => {
      const dispose = vi.fn();
      const manager = new TabManager<string>({ dispose });

      manager.open("first", "original");

      expect(() => manager.open("first", "replacement")).toThrow("Tab already exists: first");
      expect(manager.tabs.value).toEqual([{ id: "first", value: "original" }]);
      expect(dispose).not.toHaveBeenCalled();
    });
  });

  describe("close", () => {
    test("removes the selected tab and disposes its value once", () => {
      const dispose = vi.fn();
      const manager = new TabManager<string>({ dispose });

      manager.open("first", "search one");
      manager.open("second", "search two");
      manager.close("first");

      expect(manager.tabs.value).toEqual([{ id: "second", value: "search two" }]);
      expect(dispose).toHaveBeenCalledExactlyOnceWith("search one");

      manager.close("first");
      expect(dispose).toHaveBeenCalledOnce();
    });

    test("leaves the tabs and values alone for an unknown ID", () => {
      const dispose = vi.fn();
      const manager = new TabManager<string>({ dispose });

      manager.open("first", "search one");
      const tabs = manager.tabs.peek();

      manager.close("missing");

      expect(manager.tabs.value).toBe(tabs);
      expect(dispose).not.toHaveBeenCalled();
    });

    test("allows an ID to be reused after its tab closes", () => {
      const manager = new TabManager<string>({ dispose: vi.fn() });

      manager.open("first", "old search");
      manager.close("first");
      manager.open("first", "new search");

      expect(manager.tabs.value).toEqual([{ id: "first", value: "new search" }]);
    });
  });
});
