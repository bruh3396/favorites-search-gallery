import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { BrowserVisibilityObserver } from "@/adapters/browser/ports/visibility_observer/browser_visibility_observer";

type ObservedIntersection = Pick<IntersectionObserverEntry, "target" | "isIntersecting" | "intersectionRatio">;

class FakeIntersectionObserver {
  public static instances: FakeIntersectionObserver[] = [];

  public readonly observe = vi.fn();
  public readonly unobserve = vi.fn();

  constructor(private readonly callback: IntersectionObserverCallback) {
    FakeIntersectionObserver.instances.push(this);
  }

  public emit(observedIntersections: readonly ObservedIntersection[]): void {
    this.callback(observedIntersections as IntersectionObserverEntry[], this as unknown as IntersectionObserver);
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
    const fakeIntersectionObserver = FakeIntersectionObserver.instances[0];

    visibilityObserver.observe(element, onVisibilityChange);
    fakeIntersectionObserver.emit([
      { target: element, isIntersecting: true, intersectionRatio: 0.5 },
      { target: element, isIntersecting: false, intersectionRatio: 0.5 },
      { target: element, isIntersecting: true, intersectionRatio: 0 },
      { target: unrelatedElement, isIntersecting: true, intersectionRatio: 1 }
    ]);

    expect(fakeIntersectionObserver.observe).toHaveBeenCalledWith(element);
    expect(onVisibilityChange.mock.calls).toEqual([[true], [false], [false]]);
  });

  test("stops observing an element when its subscription is removed", () => {
    const element = createTarget();
    const onVisibilityChange = vi.fn();
    const visibilityObserver = new BrowserVisibilityObserver();
    const fakeIntersectionObserver = FakeIntersectionObserver.instances[0];
    const stopObserving = visibilityObserver.observe(element, onVisibilityChange);

    stopObserving();
    fakeIntersectionObserver.emit([{ target: element, isIntersecting: true, intersectionRatio: 1 }]);

    expect(fakeIntersectionObserver.unobserve).toHaveBeenCalledWith(element);
    expect(onVisibilityChange).not.toHaveBeenCalled();
  });

  test("keeps a newer subscription when an older subscription is removed", () => {
    const element = createTarget();
    const onOldVisibilityChange = vi.fn();
    const onNewVisibilityChange = vi.fn();
    const visibilityObserver = new BrowserVisibilityObserver();
    const fakeIntersectionObserver = FakeIntersectionObserver.instances[0];
    const stopOldSubscription = visibilityObserver.observe(element, onOldVisibilityChange);
    const stopNewSubscription = visibilityObserver.observe(element, onNewVisibilityChange);

    stopOldSubscription();
    fakeIntersectionObserver.emit([{ target: element, isIntersecting: true, intersectionRatio: 1 }]);

    expect(fakeIntersectionObserver.unobserve).not.toHaveBeenCalled();
    expect(onOldVisibilityChange).not.toHaveBeenCalled();
    expect(onNewVisibilityChange).toHaveBeenCalledWith(true);

    stopNewSubscription();

    expect(fakeIntersectionObserver.unobserve).toHaveBeenCalledWith(element);
  });
});
