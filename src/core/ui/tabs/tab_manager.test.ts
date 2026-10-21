import { describe, expect, test, vi } from "vitest";
import { TabManager } from "@/core/ui/tabs/tab_manager";

describe("TabManager", () => {
  test("starts with no tabs", () => {
    const manager = new TabManager<string>({ dispose: vi.fn() });

    expect(manager.tabs.value).toEqual([]);
    expect(manager.activeId.value).toBeNull();
  });

  describe("open", () => {
    test("adds tabs in the order they are opened", () => {
      const manager = new TabManager<string>({ dispose: vi.fn() });

      manager.open("first", "search one");
      manager.open("second", "search two");

      expect(manager.tabs.value).toEqual([
        { id: "first", value: "search one", closable: true },
        { id: "second", value: "search two", closable: true }
      ]);
    });

    test("rejects a duplicate ID without replacing or disposing the existing tab", () => {
      const dispose = vi.fn();
      const manager = new TabManager<string>({ dispose });

      manager.open("first", "original");

      expect(() => manager.open("first", "replacement")).toThrow("Tab already exists: first");
      expect(manager.tabs.value).toEqual([{ id: "first", value: "original", closable: true }]);
      expect(dispose).not.toHaveBeenCalled();
    });

    test("activates only the first tab opened", () => {
      const manager = new TabManager<string>({ dispose: vi.fn() });

      manager.open("first", "search one");
      manager.open("second", "search two");

      expect(manager.activeId.value).toBe("first");
    });
  });

  describe("activate", () => {
    test("activates an open tab", () => {
      const manager = new TabManager<string>({ dispose: vi.fn() });

      manager.open("first", "search one");
      manager.open("second", "search two");
      manager.activate("second");

      expect(manager.activeId.value).toBe("second");
    });

    test("ignores an unknown ID", () => {
      const manager = new TabManager<string>({ dispose: vi.fn() });

      manager.open("first", "search one");
      manager.activate("missing");

      expect(manager.activeId.value).toBe("first");
    });
  });

  describe("close", () => {
    test("activates the right neighbour when the active tab closes", () => {
      const manager = new TabManager<string>({ dispose: vi.fn() });

      manager.open("first", "search one");
      manager.open("second", "search two");
      manager.open("third", "search three");
      manager.activate("second");
      manager.close("second");

      expect(manager.activeId.value).toBe("third");
    });

    test("activates the left neighbour when the active tab closes last in line", () => {
      const manager = new TabManager<string>({ dispose: vi.fn() });

      manager.open("first", "search one");
      manager.open("second", "search two");
      manager.activate("second");
      manager.close("second");

      expect(manager.activeId.value).toBe("first");
    });

    test("keeps the active tab when another tab closes", () => {
      const manager = new TabManager<string>({ dispose: vi.fn() });

      manager.open("first", "search one");
      manager.open("second", "search two");
      manager.close("second");

      expect(manager.activeId.value).toBe("first");
    });

    test("clears the active tab when the last tab closes", () => {
      const manager = new TabManager<string>({ dispose: vi.fn() });

      manager.open("first", "search one");
      manager.close("first");

      expect(manager.activeId.value).toBeNull();
    });

    test("removes the selected tab and disposes its value once", () => {
      const dispose = vi.fn();
      const manager = new TabManager<string>({ dispose });

      manager.open("first", "search one");
      manager.open("second", "search two");
      manager.close("first");

      expect(manager.tabs.value).toEqual([{ id: "second", value: "search two", closable: true }]);
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

      expect(manager.tabs.value).toEqual([{ id: "first", value: "new search", closable: true }]);
    });

    test("keeps a tab opened as not closable", () => {
      const dispose = vi.fn();
      const manager = new TabManager<string>({ dispose });

      manager.open("home", "all favorites", { closable: false });
      const tabs = manager.tabs.peek();

      manager.close("home");

      expect(manager.tabs.value).toBe(tabs);
      expect(dispose).not.toHaveBeenCalled();
    });
  });
});
