import { describe, expect, test } from "vitest";
import { MemoryViewport } from "@/adapters/memory/ports/viewport/viewport";

describe("MemoryViewport", () => {
  test("remembers zoom being locked", () => {
    const viewport = new MemoryViewport();

    expect(viewport.zoomLocked).toBe(false);
    viewport.lockZoom();
    expect(viewport.zoomLocked).toBe(true);
  });

  test("remembers whether scrolling is locked", () => {
    const viewport = new MemoryViewport();

    expect(viewport.scrollLocked).toBe(false);
    viewport.lockScroll();
    expect(viewport.scrollLocked).toBe(true);
    viewport.unlockScroll();
    expect(viewport.scrollLocked).toBe(false);
  });
});
