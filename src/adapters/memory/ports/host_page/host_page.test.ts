import { describe, expect, test } from "vitest";
import { MemoryHostPage } from "@/adapters/memory/ports/host_page/host_page";

describe("MemoryHostPage", () => {
  test("has no header unless told it has one", () => {
    expect(new MemoryHostPage().hasHeader).toBe(false);
    expect(new MemoryHostPage(true).hasHeader).toBe(true);
  });

  test("remembers whether its header is visible", () => {
    const hostPage = new MemoryHostPage(true);

    expect(hostPage.headerVisible).toBe(true);
    hostPage.setHeaderVisible(false);
    expect(hostPage.headerVisible).toBe(false);
  });

  test("ignores header visibility when it has no header", () => {
    const hostPage = new MemoryHostPage();

    hostPage.setHeaderVisible(false);
    expect(hostPage.headerVisible).toBe(true);
  });

  test("remembers its color scheme", () => {
    const hostPage = new MemoryHostPage();

    expect(hostPage.colorScheme).toBe("light");
    hostPage.setColorScheme("dark");
    expect(hostPage.colorScheme).toBe("dark");
  });

  test("remembers the search page it last reflected", () => {
    const hostPage = new MemoryHostPage();

    expect(hostPage.searchPageIndex).toBeNull();
    hostPage.reflectSearchPage(2);
    expect(hostPage.searchPageIndex).toBe(2);
  });

  test("remembers whether its paginator is visible", () => {
    const hostPage = new MemoryHostPage();

    expect(hostPage.paginatorVisible).toBe(true);
    hostPage.setPaginatorVisible(false);
    expect(hostPage.paginatorVisible).toBe(false);
  });

  test("hands out one detached content element, however often it is claimed", () => {
    const hostPage = new MemoryHostPage();
    const content = hostPage.claimContent();

    expect(content.isConnected).toBe(false);
    expect(hostPage.claimContent()).toBe(content);
    expect(hostPage.content).toBe(content);
  });

  test("remembers its viewport being locked", () => {
    const hostPage = new MemoryHostPage();

    expect(hostPage.viewportLocked).toBe(false);
    hostPage.lockViewport();
    expect(hostPage.viewportLocked).toBe(true);
  });

  test("remembers whether its scrolling is locked", () => {
    const hostPage = new MemoryHostPage();

    expect(hostPage.scrollLocked).toBe(false);
    hostPage.lockScroll();
    expect(hostPage.scrollLocked).toBe(true);
    hostPage.unlockScroll();
    expect(hostPage.scrollLocked).toBe(false);
  });
});
