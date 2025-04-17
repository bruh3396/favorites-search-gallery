import {describe, expect, test} from "vitest";
import {clamp} from "../utils/number.js";

describe("clamp", () => {
  test("test all zeros", () => {
    expect(clamp(0, 0, 0)).toBe(0);
  });

  test("test all fives", () => {
    expect(clamp(5, 5, 5)).toBe(5);
  });

  test("test in range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  test("test clamp up to min", () => {
    expect(clamp(5, 10, 20)).toBe(10);
  });

  test("test clamp down to max", () => {
    expect(clamp(21, 10, 20)).toBe(20);
  });

  test("test negative in range", () => {
    expect(clamp(-1, -10, 10)).toBe(-1);
  });

  test("test negative clamp up", () => {
    expect(clamp(-1, 0, 10)).toBe(0);
  });
});
