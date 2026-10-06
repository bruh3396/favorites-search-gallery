import { Milestone, when } from "@/core/utils/reactive/milestone";
import { Signal, effect } from "@/core/utils/reactive/signal";
import { describe, expect, test } from "vitest";

describe("Milestone", () => {
  test("is not reached at first", () => {
    expect(new Milestone().reached).toBe(false);
  });

  test("resolves a wait that started before it was reached", async() => {
    const milestone = new Milestone<number>();
    const waited = milestone.wait();

    milestone.reach(1);
    expect(milestone.reached).toBe(true);
    await expect(waited).resolves.toBe(1);
  });

  test("resolves a wait that started after it was reached", async() => {
    const milestone = new Milestone<number>();

    milestone.reach(1);
    await expect(milestone.wait()).resolves.toBe(1);
  });

  test("reruns the effects that read it once reached", () => {
    const milestone = new Milestone();
    const seen: boolean[] = [];

    effect(() => {
      seen.push(milestone.reached);
    });
    milestone.reach();
    expect(seen).toEqual([false, true]);
  });

  test("throws when reached twice", () => {
    const milestone = new Milestone<number>();

    milestone.reach(1);
    expect(() => milestone.reach(2)).toThrow("Milestone reached twice");
  });
});

describe("when", () => {
  test("is reached at once when the condition already holds", () => {
    expect(when(() => true).reached).toBe(true);
  });

  test("is reached once the signals the condition reads make it hold", async() => {
    const count = new Signal(0);
    const fact = when(() => count.value >= 2);

    count.value = 1;
    expect(fact.reached).toBe(false);
    count.value = 2;
    expect(fact.reached).toBe(true);
    await expect(fact.wait()).resolves.toBeUndefined();
  });

  test("stays reached after the condition stops holding", () => {
    const open = new Signal(false);
    const fact = when(() => open.value);

    open.value = true;
    open.value = false;
    open.value = true;
    expect(fact.reached).toBe(true);
  });
});
