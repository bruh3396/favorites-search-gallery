import { afterEach, describe, expect, test, vi } from "vitest";
import { BrowserHostPage } from "@/adapters/browser/ports/host_page/host_page";

const LOCKED = "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no";

function getDocumentViewports(): HTMLMetaElement[] {
  return [...document.head.querySelectorAll<HTMLMetaElement>("meta[name=viewport]")];
}

describe("BrowserHostPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.head.replaceChildren();
    document.body.style.overflowY = "";
    document.documentElement.style.overflowY = "";
    document.body.style.overflowX = "";
    document.documentElement.style.width = "";
  });

  test("has no header of its own", () => {
    expect(new BrowserHostPage().hasHeader).toBe(false);
  });

  test("ignores the header, color scheme, paginator, and search page, having none", () => {
    const hostPage = new BrowserHostPage();

    expect(() => {
      hostPage.setHeaderVisible();
      hostPage.setColorScheme();
      hostPage.reflectSearchPage();
      hostPage.setPaginatorVisible();
    }).not.toThrow();
  });

  test("gives the app an element of its own at the end of the body", () => {
    const content = new BrowserHostPage().claimContent();

    expect(document.body.lastElementChild).toBe(content);
    content.remove();
  });

  test("lays the page out at full viewport width so the scrollbar overlays it", () => {
    new BrowserHostPage().claimContent().remove();
    expect(document.documentElement.style.width).toBe("100vw");
    expect(document.body.style.overflowX).toBe("clip");
  });

  test("adds a locked viewport when the page has none", () => {
    new BrowserHostPage().lockViewport();
    expect(getDocumentViewports().map(meta => meta.content)).toEqual([LOCKED]);
  });

  test("locks the page's own viewport instead of adding another", () => {
    const meta = document.createElement("meta");

    meta.name = "viewport";
    meta.content = "width=device-width";
    document.head.append(meta);
    new BrowserHostPage().lockViewport();
    expect(getDocumentViewports()).toEqual([meta]);
    expect(meta.content).toBe(LOCKED);
  });

  test("locks scrolling on the element the browser scrolls the page with", () => {
    vi.spyOn(document, "scrollingElement", "get").mockReturnValue(document.body);

    new BrowserHostPage().lockScroll();
    expect(document.body.style.overflowY).toBe("hidden");
  });

  test("locks scrolling on the root element when nothing scrolls the page", () => {
    vi.spyOn(document, "scrollingElement", "get").mockReturnValue(null);

    new BrowserHostPage().lockScroll();
    expect(document.documentElement.style.overflowY).toBe("hidden");
  });

  test("hands scrolling back to the page's own styles when unlocked", () => {
    const hostPage = new BrowserHostPage();

    hostPage.lockScroll();
    hostPage.unlockScroll();
    expect(document.documentElement.style.overflowY).toBe("");
  });
});
