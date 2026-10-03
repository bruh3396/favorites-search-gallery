import { describe, expect, test } from "vitest";
import { BrowserRandom } from "@/adapters/browser/ports/random/random";

describe("BrowserRandom", () => {
  test("returns floats in [0, 1)", () => {
    const random = new BrowserRandom();

    for (let i = 0; i < 1_000; i += 1) {
      const value = random.next();

      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});
