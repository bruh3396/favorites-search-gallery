import { describe, expect, test, vi } from "vitest";
import { MemorySizeObserver } from "@/adapters/memory/ports/size_observer/size_observer";

describe("MemorySizeObserver", () => {
  test("reports a resize to the element's observers until they stop", () => {
    const sizeObserver = new MemorySizeObserver();
    const element = {} as Element;
    const onResize = vi.fn();
    const stop = sizeObserver.observe(element, onResize);

    sizeObserver.resize(element, { width: 10, height: 20 });
    sizeObserver.resize({} as Element, { width: 1, height: 1 });
    stop();
    sizeObserver.resize(element, { width: 30, height: 40 });
    expect(onResize.mock.calls).toEqual([[{ width: 10, height: 20, devicePixelWidth: 10 }]]);
  });

  test("reports a given device pixel width", () => {
    const sizeObserver = new MemorySizeObserver();
    const element = {} as Element;
    const onResize = vi.fn();

    sizeObserver.observe(element, onResize);
    sizeObserver.resize(element, { width: 10, height: 20, devicePixelWidth: 15 });
    expect(onResize).toHaveBeenCalledWith({ width: 10, height: 20, devicePixelWidth: 15 });
  });
});
