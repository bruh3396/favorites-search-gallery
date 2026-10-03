import { describe, expect, test } from "vitest";
import { BrowserRandomSource } from "@/adapters/browser/ports/random_source/random_source";

describe("BrowserRandomSource", () => {
  test("returns floats in [0, 1)", () => {
    const randomSource = new BrowserRandomSource();

    for (let i = 0; i < 1_000; i += 1) {
      const value = randomSource.next();

      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});
