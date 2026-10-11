import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { BrowserVisibilityObserver } from "@/adapters/browser/ports/visibility_observer/visibility_observer";

type ObservedIntersection = Pick<IntersectionObserverEntry, "target" | "isIntersecting" | "intersectionRatio">;

class FakeIntersectionObserver {
  public static instances: FakeIntersectionObserver[] = [];

  public readonly observe = vi.fn();
  public readonly unobserve = vi.fn();

  constructor(private readonly callback: IntersectionObserverCallback) {
    FakeIntersectionObserver.instances.push(this);
  }

  public emit(entries: readonly ObservedIntersection[]): void {
    this.callback(entries as IntersectionObserverEntry[], this as unknown as IntersectionObserver);
  }
}

function createTarget(): Element {
  return {} as unknown as Element;
}

describe("BrowserVisibilityObserver", () => {
  beforeEach(() => {
    FakeIntersectionObserver.instances = [];
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("observes elements and reports their intersection state", () => {
    const element = createTarget();
    const unrelatedElement = createTarget();
    const onVisibilityChange = vi.fn();
    const visibilityObserver = new BrowserVisibilityObserver();
    const intersectionObserver = FakeIntersectionObserver.instances[0];

    visibilityObserver.observe(element, onVisibilityChange);
    intersectionObserver.emit([
      { target: element, isIntersecting: true, intersectionRatio: 0.5 },
      { target: element, isIntersecting: false, intersectionRatio: 0.5 },
      { target: element, isIntersecting: true, intersectionRatio: 0 },
      { target: unrelatedElement, isIntersecting: true, intersectionRatio: 1 }
    ]);

    expect(intersectionObserver.observe).toHaveBeenCalledWith(element);
    expect(onVisibilityChange.mock.calls).toEqual([[true], [false], [false]]);
  });

  test("stops observing an element when its subscription is removed", () => {
    const element = createTarget();
    const onVisibilityChange = vi.fn();
    const visibilityObserver = new BrowserVisibilityObserver();
    const intersectionObserver = FakeIntersectionObserver.instances[0];
    const stopObserving = visibilityObserver.observe(element, onVisibilityChange);

    stopObserving();
    intersectionObserver.emit([{ target: element, isIntersecting: true, intersectionRatio: 1 }]);

    expect(intersectionObserver.unobserve).toHaveBeenCalledWith(element);
    expect(onVisibilityChange).not.toHaveBeenCalled();
  });

  test("keeps a newer subscription when an older subscription is removed", () => {
    const element = createTarget();
    const onOldVisibilityChange = vi.fn();
    const onNewVisibilityChange = vi.fn();
    const visibilityObserver = new BrowserVisibilityObserver();
    const intersectionObserver = FakeIntersectionObserver.instances[0];
    const stopOldSubscription = visibilityObserver.observe(element, onOldVisibilityChange);
    const stopNewSubscription = visibilityObserver.observe(element, onNewVisibilityChange);

    stopOldSubscription();
    intersectionObserver.emit([{ target: element, isIntersecting: true, intersectionRatio: 1 }]);

    expect(intersectionObserver.unobserve).not.toHaveBeenCalled();
    expect(onOldVisibilityChange).not.toHaveBeenCalled();
    expect(onNewVisibilityChange).toHaveBeenCalledWith(true);

    stopNewSubscription();

    expect(intersectionObserver.unobserve).toHaveBeenCalledWith(element);
  });
});
