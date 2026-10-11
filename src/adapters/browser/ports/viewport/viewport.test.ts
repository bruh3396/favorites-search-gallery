import { afterEach, describe, expect, test, vi } from "vitest";
import { BrowserViewport } from "@/adapters/browser/ports/viewport/viewport";

const LOCKED = "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no";

function getDocumentViewports(): HTMLMetaElement[] {
  return [...document.head.querySelectorAll<HTMLMetaElement>("meta[name=viewport]")];
}

describe("BrowserViewport", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.head.replaceChildren();
    document.body.style.overflowY = "";
    document.documentElement.style.overflowY = "";
  });

  test("adds a locked viewport when the page has none", () => {
    new BrowserViewport().lockZoom();
    expect(getDocumentViewports().map(meta => meta.content)).toEqual([LOCKED]);
  });

  test("locks the page's own viewport instead of adding another", () => {
    const meta = document.createElement("meta");

    meta.name = "viewport";
    meta.content = "width=device-width";
    document.head.append(meta);
    new BrowserViewport().lockZoom();
    expect(getDocumentViewports()).toEqual([meta]);
    expect(meta.content).toBe(LOCKED);
  });

  test("locks scrolling on the element the browser scrolls the page with", () => {
    vi.spyOn(document, "scrollingElement", "get").mockReturnValue(document.body);

    new BrowserViewport().lockScroll();
    expect(document.body.style.overflowY).toBe("hidden");
  });

  test("locks scrolling on the root element when nothing scrolls the page", () => {
    vi.spyOn(document, "scrollingElement", "get").mockReturnValue(null);

    new BrowserViewport().lockScroll();
    expect(document.documentElement.style.overflowY).toBe("hidden");
  });

  test("hands scrolling back to the page's own styles when unlocked", () => {
    const viewport = new BrowserViewport();

    viewport.lockScroll();
    viewport.unlockScroll();
    expect(document.documentElement.style.overflowY).toBe("");
  });
});
