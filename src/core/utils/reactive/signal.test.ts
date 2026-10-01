import { Signal, effect } from "@/core/utils/reactive/signal";
import { describe, expect, test } from "vitest";

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
