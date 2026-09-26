import { describe, expect, test } from "vitest";
import { PreferenceOverrides } from "@/testing/preferences";
import { TooltipModel } from "@/features/tooltip/model/model";
import { createAppContext } from "@/testing/context";

const LIGHT_LIGHTNESS = "70%)";
const DARK_LIGHTNESS = "45%)";

function createModel(onFavoritesPage: boolean, preferences: PreferenceOverrides = {}): TooltipModel {
  return new TooltipModel(createAppContext({ environment: { onFavoritesPage, onPostListPage: !onFavoritesPage }, preferences }));
}

describe("TooltipModel", () => {
  describe("highlights", () => {
    test("colors tags matched by the rebuilt query and nothing else", () => {
      const model = createModel(true);

      model.rebuildHighlights("red ( blue ~ green ) sw* -black");
      expect(model.colorForTag("red")).not.toBeNull();
      expect(model.colorForTag("green")).not.toBeNull();
      expect(model.colorForTag("sweet")).not.toBeNull();
      expect(model.colorForTag("black")).toBeNull();
      expect(model.colorForTag("white")).toBeNull();
    });

    test("has no highlights before the first rebuild", () => {
      expect(createModel(true).colorForTag("red")).toBeNull();
    });

    test("rebuilding replaces the previous highlights", () => {
      const model = createModel(true);

      model.rebuildHighlights("red");
      model.rebuildHighlights("blue");
      expect(model.colorForTag("red")).toBeNull();
      expect(model.colorForTag("blue")).not.toBeNull();
    });

    test.each([
      [false, DARK_LIGHTNESS],
      [true, LIGHT_LIGHTNESS]
    ])("uses the color for the dark mode preference (dark mode %s)", (darkMode, lightness) => {
      const model = createModel(true, { app: { darkMode } });

      model.rebuildHighlights("red");
      expect(model.colorForTag("red")).toMatch(lightness);
    });
  });

  describe("visibility", () => {
    test.each([true, false])("on the favorites page, follows only the favorites preference (%s)", (enabled) => {
      const model = createModel(true, { favorites: { tooltipEnabled: enabled }, postList: { tooltipEnabled: !enabled } });

      expect(model.tooltipEnabled()).toBe(enabled);
    });

    test.each([true, false])("on the post list page, follows only the post list preference (%s)", (enabled) => {
      const model = createModel(false, { favorites: { tooltipEnabled: !enabled }, postList: { tooltipEnabled: enabled } });

      expect(model.tooltipEnabled()).toBe(enabled);
    });
  });
});
