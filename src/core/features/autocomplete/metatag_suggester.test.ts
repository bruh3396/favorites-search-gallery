import { describe, expect, test } from "vitest";
import { MetatagSuggester } from "@/core/features/autocomplete/metatag_suggester";

function listTexts(prefix: string): string[] {
  return new MetatagSuggester().suggest(prefix).map(suggestion => suggestion.text);
}

describe("MetatagSuggester", () => {
  describe("suggest", () => {
    test("describes a metatag with its icon", () => {
      expect(new MetatagSuggester().suggest("width:<")).toEqual([{ text: "width:<height", icon: "sliders" }]);
    });

    test("offers every comparison from the start of a name", () => {
      expect(listTexts("sc")).toEqual(["score:>", "score:<", "score:"]);
      expect(listTexts("d")).toEqual(["duration:>", "duration:<", "duration:"]);
    });

    test("offers nothing for a word no metatag starts with", () => {
      expect(listTexts("cat")).toEqual([]);
    });

    test("leaves out changedAt", () => {
      expect(listTexts("ch")).toEqual([]);
      expect(listTexts("changedAt:")).toEqual([]);
    });

    test("offers number comparisons before the opposite side for width and height", () => {
      expect(listTexts("w")).toEqual(["width:>", "width:<", "width:", "width:>height", "width:<height", "width:height"]);
      expect(listTexts("h")).toEqual(["height:>", "height:<", "height:", "height:>width", "height:<width", "height:width"]);
    });

    test("narrows comparisons as more is typed", () => {
      expect(listTexts("width:>h")).toEqual(["width:>height"]);
    });

    test("offers what can follow a finished metatag, not the metatag itself", () => {
      expect(listTexts("score:")).toEqual(["score:>", "score:<"]);
      expect(listTexts("score:<")).toEqual([]);
    });

    test("offers nothing once a number follows the comparison", () => {
      expect(listTexts("score:>1")).toEqual([]);
    });
  });
});
