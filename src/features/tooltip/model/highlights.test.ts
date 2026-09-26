import { describe, expect, test } from "vitest";
import { TooltipHighlights } from "@/features/tooltip/model/highlights";

const LIGHT_LIGHTNESS = "70%)";
const DARK_LIGHTNESS = "45%)";

function highlightsFor(query: string, usingDarkMode: boolean): TooltipHighlights {
  const highlights = new TooltipHighlights({ usingDarkMode: (): boolean => usingDarkMode });

  highlights.rebuild(query);
  return highlights;
}

describe("TooltipHighlights", () => {
  test("gives matching tags the dark color when dark mode is off", () => {
    expect(highlightsFor("red", false).colorForTag("red")).toMatch(DARK_LIGHTNESS);
  });

  test("gives matching tags the light color when dark mode is on", () => {
    expect(highlightsFor("red", true).colorForTag("red")).toMatch(LIGHT_LIGHTNESS);
  });

  test.each([false, true])("returns null for a tag no search term matches (dark mode %s)", (usingDarkMode) => {
    expect(highlightsFor("red", usingDarkMode).colorForTag("blue")).toBeNull();
  });

  test("highlights members of or groups and wildcard matches", () => {
    const highlights = highlightsFor("( blue ~ green ) sw*", false);

    expect(highlights.colorForTag("green")).not.toBeNull();
    expect(highlights.colorForTag("sweet")).not.toBeNull();
  });

  test("does not highlight negated terms", () => {
    expect(highlightsFor("red -blue", false).colorForTag("blue")).toBeNull();
  });

  test("reads the dark mode setting at lookup time", () => {
    let usingDarkMode = false;
    const highlights = new TooltipHighlights({ usingDarkMode: (): boolean => usingDarkMode });

    highlights.rebuild("red");
    expect(highlights.colorForTag("red")).toMatch(DARK_LIGHTNESS);
    usingDarkMode = true;
    expect(highlights.colorForTag("red")).toMatch(LIGHT_LIGHTNESS);
  });

  test("rebuild replaces the previous highlights", () => {
    const highlights = highlightsFor("red", false);

    highlights.rebuild("blue");
    expect(highlights.colorForTag("red")).toBeNull();
    expect(highlights.colorForTag("blue")).not.toBeNull();
  });
});
