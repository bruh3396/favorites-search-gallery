import { describe, expect, test } from "vitest";
import { Milestone } from "@/core/utils/async/milestone";

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

  test("throws when reached twice", () => {
    const milestone = new Milestone<number>();

    milestone.reach(1);
    expect(() => milestone.reach(2)).toThrow("Milestone reached twice");
  });
});
