import { Signal, batch, computed, effect, untracked } from "@/core/utils/reactive/signal";
import { describe, expect, test, vi } from "vitest";
import { createScope } from "@/core/utils/reactive/scope";

function setup<T>(initial: T): { signal: Signal<T>; seen: T[] } {
  const signal = new Signal(initial);
  const seen: T[] = [];

  effect(() => seen.push(signal.value));
  return { signal, seen };
}

describe("Signal", () => {
  test("returns its value outside an effect", () => {
    const signal = new Signal(1);

    signal.value = 2;
    expect(signal.value).toBe(2);
  });

  test("peeks without making an effect depend on it", () => {
    const signal = new Signal(1);
    const seen: number[] = [];

    effect(() => seen.push(signal.peek()));
    signal.value = 2;
    expect(seen).toEqual([1]);
  });
});

describe("effect", () => {
  test("runs at once", () => {
    const { seen } = setup(true);

    expect(seen).toEqual([true]);
  });

  test("runs again when a signal it read changes", () => {
    const { signal, seen } = setup(true);

    signal.value = false;
    expect(seen).toEqual([true, false]);
  });

  test("ignores a write of the same value", () => {
    const { signal, seen } = setup(true);

    signal.value = true;
    expect(seen).toEqual([true]);
  });

  test("ignores a signal it did not read", () => {
    const { seen } = setup(1);
    const other = new Signal(1);

    other.value = 2;
    expect(seen).toEqual([1]);
  });

  test("runs again when any of several signals it read changes", () => {
    const first = new Signal(false);
    const second = new Signal(false);
    const seen: boolean[] = [];

    effect(() => seen.push(first.value || second.value));
    second.value = true;
    first.value = true;
    expect(seen).toEqual([false, true, true]);
  });

  test("follows only the signals its latest run read", () => {
    const useLeft = new Signal(true);
    const left = new Signal("a");
    const right = new Signal("x");
    const seen: string[] = [];

    effect(() => seen.push(useLeft.value ? left.value : right.value));
    right.value = "y";
    useLeft.value = false;
    left.value = "b";
    right.value = "z";
    expect(seen).toEqual(["a", "y", "z"]);
  });

  test("stops once disposed", () => {
    const signal = new Signal(1);
    const seen: number[] = [];
    const dispose = effect(() => seen.push(signal.value));

    dispose();
    signal.value = 2;
    expect(seen).toEqual([1]);
  });

  test("skips a run queued before it was disposed", () => {
    const signal = new Signal(1);
    const seen: number[] = [];
    const dispose = effect(() => seen.push(signal.value));

    batch(() => {
      signal.value = 2;
      dispose();
    });
    expect(seen).toEqual([1]);
  });

  test("throws when it changes a signal it read", () => {
    const signal = new Signal(0);

    expect(() => effect(() => {
      signal.value += 1;
    })).toThrow("An effect changed a signal it reads");
  });

  test("tracks nothing after an effect throws", () => {
    const signal = new Signal(1);
    const seen: number[] = [];

    expect(() => effect(() => {
      throw new Error("boom");
    })).toThrow("boom");
    expect(signal.value).toBe(1);
    effect(() => seen.push(1));
    signal.value = 2;
    expect(seen).toEqual([1]);
  });
});

describe("computed", () => {
  test("returns what its function returns for the current inputs", () => {
    const price = new Signal(2);
    const quantity = new Signal(3);
    const total = computed(() => price.value * quantity.value);

    expect(total.value).toBe(6);
    quantity.value = 10;
    expect(total.value).toBe(20);
  });

  test("runs its function only when read", () => {
    const signal = new Signal(1);
    let runCount = 0;
    const doubled = computed(() => {
      runCount += 1;
      return signal.value * 2;
    });

    signal.value = 2;
    signal.value = 3;
    expect(runCount).toBe(0);
    expect(doubled.value).toBe(6);
    expect(runCount).toBe(1);
  });

  test("reuses its result until an input changes", () => {
    const signal = new Signal(1);
    let runCount = 0;
    const doubled = computed(() => {
      runCount += 1;
      return [signal.value * 2];
    });
    const first = doubled.value;

    expect(doubled.value).toBe(first);
    signal.value = 2;
    expect(doubled.value).toEqual([4]);
    expect(runCount).toBe(2);
  });

  test("reruns an effect that read it when an input changes", () => {
    const signal = new Signal(1);
    const doubled = computed(() => signal.value * 2);
    const seen: number[] = [];

    effect(() => seen.push(doubled.value));
    signal.value = 2;
    expect(seen).toEqual([2, 4]);
  });

  test("skips an effect that read it when its result stays the same", () => {
    const signal = new Signal(1);
    const isPositive = computed(() => signal.value > 0);
    const seen: boolean[] = [];

    effect(() => seen.push(isPositive.value));
    signal.value = 2;
    signal.value = -1;
    expect(seen).toEqual([true, false]);
  });

  test("skips an effect when a computed it reads through another stays the same", () => {
    const signal = new Signal(1);
    const isPositive = computed(() => signal.value > 0);
    const label = computed(() => (isPositive.value ? "yes" : "no"));
    const seen: string[] = [];

    effect(() => seen.push(label.value));
    signal.value = 2;
    expect(seen).toEqual(["yes"]);
  });

  test("reruns an effect for a changed signal it read beside an unchanged computed", () => {
    const signal = new Signal(1);
    const isPositive = computed(() => signal.value > 0);
    const seen: Array<[number, boolean]> = [];

    effect(() => seen.push([signal.value, isPositive.value]));
    signal.value = 2;
    expect(seen).toEqual([[1, true], [2, true]]);
  });

  test("never shows an effect a stale result beside a fresh input", () => {
    const signal = new Signal(1);
    const doubled = computed(() => signal.value * 2);
    const seen: number[][] = [];

    effect(() => seen.push([signal.value, doubled.value]));
    signal.value = 2;
    expect(seen).toEqual([[1, 2], [2, 4]]);
  });

  test("feeds another computed", () => {
    const signal = new Signal(1);
    const doubled = computed(() => signal.value * 2);
    const quadrupled = computed(() => doubled.value * 2);
    const seen: number[] = [];

    effect(() => seen.push(quadrupled.value));
    signal.value = 2;
    expect(seen).toEqual([4, 8]);
  });

  test("follows only the signals its latest run read", () => {
    const useLeft = new Signal(true);
    const left = new Signal("a");
    const right = new Signal("x");
    const chosen = computed(() => (useLeft.value ? left.value : right.value));
    const seen: string[] = [];

    effect(() => seen.push(chosen.value));
    right.value = "y";
    useLeft.value = false;
    left.value = "b";
    expect(seen).toEqual(["a", "y"]);
  });

  test("keeps the result of an unchanged input while a computed reading it reruns", () => {
    const left = new Signal(1);
    const right = new Signal(1);
    let runCount = 0;
    const stable = computed(() => {
      runCount += 1;
      return left.value;
    });
    const sum = computed(() => stable.value + right.value);
    const seen: number[] = [];

    effect(() => seen.push(sum.value));
    right.value = 2;
    expect(seen).toEqual([2, 3]);
    expect(runCount).toBe(1);
  });

  test("keeps its result while an effect reading it reruns for another input", () => {
    const left = new Signal(1);
    const right = new Signal(1);
    let runCount = 0;
    const stable = computed(() => {
      runCount += 1;
      return left.value;
    });
    const seen: number[] = [];

    effect(() => seen.push(stable.value + right.value));
    right.value = 2;
    expect(seen).toEqual([2, 3]);
    expect(runCount).toBe(1);
  });

  test("peeks without making an effect depend on it", () => {
    const signal = new Signal(1);
    const doubled = computed(() => signal.value * 2);
    const seen: number[] = [];

    effect(() => seen.push(doubled.peek()));
    signal.value = 2;
    expect(seen).toEqual([2]);
    expect(doubled.value).toBe(4);
  });

  test("keeps following its inputs while another effect still reads it", () => {
    const signal = new Signal(1);
    const doubled = computed(() => signal.value * 2);
    const seen: number[] = [];
    const dispose = effect(() => doubled.value);

    effect(() => seen.push(doubled.value));
    dispose();
    signal.value = 2;
    expect(seen).toEqual([2, 4]);
  });

  test("lets go of its inputs once nothing reads it", () => {
    const signal = new Signal(1);
    const unsubscribe = vi.spyOn(signal, "unsubscribe");
    const doubled = computed(() => signal.value * 2);
    const dispose = effect(() => doubled.value);

    dispose();
    expect(unsubscribe).toHaveBeenCalledOnce();
    expect(doubled.value).toBe(2);
    signal.value = 2;
    expect(doubled.value).toBe(4);
  });
});

describe("effect in a scope", () => {
  test("stops when the scope it was created in is disposed", () => {
    const signal = new Signal(1);
    const seen: number[] = [];
    const { dispose } = createScope(() => effect(() => seen.push(signal.value)));

    dispose();
    signal.value = 2;
    expect(seen).toEqual([1]);
  });

  test("leaves its scope once disposed on its own", () => {
    const signal = new Signal(1);
    const seen: number[] = [];
    const scope = createScope(() => effect(() => seen.push(signal.value)));

    scope.result();
    scope.dispose();
    signal.value = 2;
    expect(seen).toEqual([1]);
  });
});

describe("untracked", () => {
  test("returns what its function returns", () => {
    expect(untracked(() => 1)).toBe(1);
  });

  test("keeps an enclosing effect from depending on what it reads", () => {
    const tracked = new Signal(1);
    const ignored = new Signal(1);
    const seen: number[] = [];

    effect(() => seen.push(tracked.value + untracked(() => ignored.value)));
    ignored.value = 2;
    tracked.value = 2;
    expect(seen).toEqual([2, 4]);
  });
});

describe("batch", () => {
  test("returns what its function returns", () => {
    expect(batch(() => 1)).toBe(1);
  });

  test("runs an effect once after several writes it depends on", () => {
    const first = new Signal(1);
    const second = new Signal(1);
    const seen: number[] = [];

    effect(() => seen.push(first.value + second.value));
    batch(() => {
      first.value = 2;
      second.value = 3;
    });
    expect(seen).toEqual([2, 5]);
  });

  test("defers effects until it finishes", () => {
    const { signal, seen } = setup(1);

    batch(() => {
      signal.value = 2;
      expect(seen).toEqual([1]);
    });
    expect(seen).toEqual([1, 2]);
  });

  test("lets reads inside it see the new values", () => {
    const signal = new Signal(1);
    const doubled = computed(() => signal.value * 2);

    batch(() => {
      signal.value = 2;
      expect(signal.value).toBe(2);
      expect(doubled.value).toBe(4);
    });
  });

  test("runs an effect that reads a computed once with the final values", () => {
    const first = new Signal(1);
    const second = new Signal(1);
    const sum = computed(() => first.value + second.value);
    const seen: number[] = [];

    effect(() => seen.push(sum.value));
    batch(() => {
      first.value = 2;
      second.value = 3;
    });
    expect(seen).toEqual([2, 5]);
  });

  test("runs an effect once when the writes restore the original value", () => {
    const { signal, seen } = setup(1);

    batch(() => {
      signal.value = 2;
      signal.value = 1;
    });
    expect(seen).toEqual([1, 1]);
  });

  test("defers effects until the outermost batch finishes", () => {
    const { signal, seen } = setup(1);

    batch(() => {
      batch(() => {
        signal.value = 2;
      });
      expect(seen).toEqual([1]);
    });
    expect(seen).toEqual([1, 2]);
  });

  test("runs pending effects when its function throws", () => {
    const { signal, seen } = setup(1);

    expect(() => batch(() => {
      signal.value = 2;
      throw new Error("failed");
    })).toThrow("failed");
    expect(seen).toEqual([1, 2]);
  });

  test("runs effects at once again after it finishes", () => {
    const { signal, seen } = setup(1);

    batch(() => {
      signal.value = 2;
    });
    signal.value = 3;
    expect(seen).toEqual([1, 2, 3]);
  });
});
