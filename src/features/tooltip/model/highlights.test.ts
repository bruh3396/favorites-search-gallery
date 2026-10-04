import { describe, expect, test } from "vitest";
import { ColorScheme } from "@/core/boundary/environment";
import { TooltipHighlights } from "@/features/tooltip/model/highlights";

const LIGHT_LIGHTNESS = "70%)";
const DARK_LIGHTNESS = "45%)";

function buildHighlights(query: string, colorScheme: ColorScheme): TooltipHighlights {
  const highlights = new TooltipHighlights({ colorScheme: (): ColorScheme => colorScheme });

  highlights.rebuild(query);
  return highlights;
}

describe("TooltipHighlights", () => {
  test("gives matching tags the dark color in the light scheme", () => {
    expect(buildHighlights("red", "light").colorForTag("red")).toMatch(DARK_LIGHTNESS);
  });

  test("gives matching tags the light color in the dark scheme", () => {
    expect(buildHighlights("red", "dark").colorForTag("red")).toMatch(LIGHT_LIGHTNESS);
  });

  test.each<ColorScheme>(["light", "dark"])("returns null for a tag no search term matches (%s)", colorScheme => {
    expect(buildHighlights("red", colorScheme).colorForTag("blue")).toBeNull();
  });

  test("highlights members of or groups and wildcard matches", () => {
    const highlights = buildHighlights("( blue ~ green ) sw*", "light");

    expect(highlights.colorForTag("green")).not.toBeNull();
    expect(highlights.colorForTag("sweet")).not.toBeNull();
  });

  test("does not highlight negated terms", () => {
    expect(buildHighlights("red -blue", "light").colorForTag("blue")).toBeNull();
  });

  test("reads the color scheme at lookup time", () => {
    let colorScheme: ColorScheme = "light";
    const highlights = new TooltipHighlights({ colorScheme: (): ColorScheme => colorScheme });

    highlights.rebuild("red");
    expect(highlights.colorForTag("red")).toMatch(DARK_LIGHTNESS);
    colorScheme = "dark";
    expect(highlights.colorForTag("red")).toMatch(LIGHT_LIGHTNESS);
  });

  test("replaces the previous highlights on rebuild", () => {
    const highlights = buildHighlights("red", "light");

    highlights.rebuild("blue");
    expect(highlights.colorForTag("red")).toBeNull();
    expect(highlights.colorForTag("blue")).not.toBeNull();
  });
});
