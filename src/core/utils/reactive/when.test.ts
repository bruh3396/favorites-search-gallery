import { describe, expect, test } from "vitest";
import { Signal } from "@/core/utils/reactive/signal";
import { when } from "@/core/utils/reactive/when";

describe("when", () => {
  test("reaches at once when the condition already holds", () => {
    expect(when(() => true).reached).toBe(true);
  });

  test("reaches once the signals the condition reads make it hold", async() => {
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
