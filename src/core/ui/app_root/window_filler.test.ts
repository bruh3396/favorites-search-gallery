import { describe, expect, test } from "vitest";
import { MemorySizeObserver } from "@/adapters/memory/ports/size_observer/memory_size_observer";
import { fillWindow } from "@/core/ui/app_root/window_filler";

function setup(): { element: HTMLElement; sizeObserver: MemorySizeObserver; moveTo: (top: number) => void } {
  const element = document.createElement("div");
  const sizeObserver = new MemorySizeObserver();
  const moveTo = (top: number): void => {
    element.getBoundingClientRect = (): DOMRect => new DOMRect(0, top, 0, 0);
  };

  moveTo(40);
  return { element, sizeObserver, moveTo };
}

describe("fillWindow", () => {
  test("sizes the element to the window below its top", () => {
    const { element, sizeObserver } = setup();

    fillWindow(element, sizeObserver);
    expect(element.style.blockSize).toBe("calc(100dvh - 40px)");
  });

  test("refits when the page resizes", () => {
    const { element, sizeObserver, moveTo } = setup();

    fillWindow(element, sizeObserver);
    moveTo(0);
    sizeObserver.resize(document.documentElement, { width: 800, height: 600 });
    expect(element.style.blockSize).toBe("calc(100dvh - 0px)");
  });

  test("refits when told, for a move that leaves the page's size unchanged", () => {
    const { element, sizeObserver, moveTo } = setup();
    const { refit } = fillWindow(element, sizeObserver);

    moveTo(0);
    refit();
    expect(element.style.blockSize).toBe("calc(100dvh - 0px)");
  });

  test("stops refitting once disposed", () => {
    const { element, sizeObserver, moveTo } = setup();

    fillWindow(element, sizeObserver).dispose();
    moveTo(0);
    sizeObserver.resize(document.documentElement, { width: 800, height: 600 });
    expect(element.style.blockSize).toBe("calc(100dvh - 40px)");
  });
});
