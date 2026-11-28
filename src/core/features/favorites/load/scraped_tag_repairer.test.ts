import { describe, expect, test } from "vitest";
import { ScrapedTagRepairer } from "@/core/features/favorites/load/scraped_tag_repairer";

function createPrimedScrapedTagRepairer(tagNames: readonly string[]): ScrapedTagRepairer {
  const scrapedTagRepairer = new ScrapedTagRepairer();

  scrapedTagRepairer.prime(new Set(tagNames));
  return scrapedTagRepairer;
}

describe("ScrapedTagRepairer", () => {
  describe("repair", () => {
    test("restores a truncated first tag and a truncated last tag", () => {
      const scrapedTagRepairer = createPrimedScrapedTagRepairer(["tiefling", "turtleneck", "apple"]);

      expect(scrapedTagRepairer.repair("iefling apple turtlenec")).toBe("tiefling apple turtleneck");
    });

    test("leaves middle tags alone", () => {
      const scrapedTagRepairer = createPrimedScrapedTagRepairer(["tiefling", "turtleneck", "apple", "banana"]);

      expect(scrapedTagRepairer.repair("apple iefling turtlenec banana")).toBe("apple iefling turtlenec banana");
    });

    test("leaves an end tag that is itself a tag", () => {
      const scrapedTagRepairer = createPrimedScrapedTagRepairer(["wing", "wings", "apple"]);

      expect(scrapedTagRepairer.repair("apple wing")).toBe("apple wing");
    });

    test("leaves an end tag that several tags truncate to", () => {
      const scrapedTagRepairer = createPrimedScrapedTagRepairer(["1girls", "2girls", "3girls", "apple"]);

      expect(scrapedTagRepairer.repair("girls apple")).toBe("girls apple");
    });

    test("leaves an end tag that no tag truncates to", () => {
      const scrapedTagRepairer = createPrimedScrapedTagRepairer(["apple", "banana"]);

      expect(scrapedTagRepairer.repair("ppl apple bana")).toBe("ppl apple bana");
    });

    test("never restores an empty name from a one-character tag", () => {
      const scrapedTagRepairer = createPrimedScrapedTagRepairer(["d", "apple"]);

      expect(scrapedTagRepairer.repair(" apple")).toBe(" apple");
    });

    test("leaves tags unchanged before it is primed", () => {
      expect(new ScrapedTagRepairer().repair("iefling apple")).toBe("iefling apple");
    });
  });
});
