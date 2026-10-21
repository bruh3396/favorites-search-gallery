import { describe, expect, test } from "vitest";
import { MemorySizeObserver } from "@/adapters/memory/ports/size_observer/size_observer";
import { fillRestOfWindow } from "@/core/ui/app_root/fill_rest_of_window";

function setup(): { element: HTMLElement; sizeObserver: MemorySizeObserver; moveTo: (top: number) => void } {
  const element = document.createElement("div");
  const sizeObserver = new MemorySizeObserver();
  const moveTo = (top: number): void => {
    element.getBoundingClientRect = (): DOMRect => new DOMRect(0, top, 0, 0);
  };

  moveTo(40);
  return { element, sizeObserver, moveTo };
}

describe("fillRestOfWindow", () => {
  test("sizes the element to the window below its top", () => {
    const { element, sizeObserver } = setup();

    fillRestOfWindow(element, sizeObserver);
    expect(element.style.blockSize).toBe("calc(100dvh - 40px)");
  });

  test("refits when the page resizes", () => {
    const { element, sizeObserver, moveTo } = setup();

    fillRestOfWindow(element, sizeObserver);
    moveTo(0);
    sizeObserver.resize(document.documentElement, { width: 800, height: 600 });
    expect(element.style.blockSize).toBe("calc(100dvh - 0px)");
  });

  test("stops refitting once stopped", () => {
    const { element, sizeObserver, moveTo } = setup();

    fillRestOfWindow(element, sizeObserver)();
    moveTo(0);
    sizeObserver.resize(document.documentElement, { width: 800, height: 600 });
    expect(element.style.blockSize).toBe("calc(100dvh - 40px)");
  });
});
