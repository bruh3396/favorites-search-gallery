import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { BrowserSizeObserver } from "@/adapters/browser/ports/size_observer/size_observer";

interface ObservedResize {
  readonly target: Element;
  readonly contentRect: { readonly width: number; readonly height: number };
}

class FakeResizeObserver {
  public static instances: FakeResizeObserver[] = [];

  public readonly observe = vi.fn();
  public readonly unobserve = vi.fn();

  constructor(private readonly callback: ResizeObserverCallback) {
    FakeResizeObserver.instances.push(this);
  }

  public emit(entries: readonly ObservedResize[]): void {
    this.callback(entries as unknown as ResizeObserverEntry[], this as unknown as ResizeObserver);
  }
}

function createTarget(): Element {
  return {} as unknown as Element;
}

describe("BrowserSizeObserver", () => {
  beforeEach(() => {
    FakeResizeObserver.instances = [];
    vi.stubGlobal("ResizeObserver", FakeResizeObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("observes elements and reports their content size", () => {
    const element = createTarget();
    const onResize = vi.fn();
    const sizeObserver = new BrowserSizeObserver();
    const resizeObserver = FakeResizeObserver.instances[0];

    sizeObserver.observe(element, onResize);
    resizeObserver.emit([
      { target: element, contentRect: { width: 1_000, height: 500 } },
      { target: createTarget(), contentRect: { width: 1, height: 1 } }
    ]);

    expect(resizeObserver.observe).toHaveBeenCalledWith(element);
    expect(onResize.mock.calls).toEqual([[{ width: 1_000, height: 500 }]]);
  });

  test("stops observing an element when its subscription is removed", () => {
    const element = createTarget();
    const onResize = vi.fn();
    const sizeObserver = new BrowserSizeObserver();
    const resizeObserver = FakeResizeObserver.instances[0];

    sizeObserver.observe(element, onResize)();
    resizeObserver.emit([{ target: element, contentRect: { width: 1, height: 1 } }]);

    expect(resizeObserver.unobserve).toHaveBeenCalledWith(element);
    expect(onResize).not.toHaveBeenCalled();
  });

  test("keeps a newer subscription when an older subscription is removed", () => {
    const element = createTarget();
    const onNewResize = vi.fn();
    const sizeObserver = new BrowserSizeObserver();
    const resizeObserver = FakeResizeObserver.instances[0];
    const stopOldSubscription = sizeObserver.observe(element, vi.fn());

    sizeObserver.observe(element, onNewResize);
    stopOldSubscription();
    resizeObserver.emit([{ target: element, contentRect: { width: 2, height: 3 } }]);

    expect(resizeObserver.unobserve).not.toHaveBeenCalled();
    expect(onNewResize).toHaveBeenCalledWith({ width: 2, height: 3 });
  });
});
