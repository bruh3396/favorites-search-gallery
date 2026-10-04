import { describe, expect, test } from "vitest";
import { ColorScheme } from "@/core/boundary/environment";
import { PreferenceOverrides } from "@/testing/preferences";
import { TooltipModel } from "@/features/tooltip/model/model";
import { createAppContext } from "@/testing/context";

const LIGHT_LIGHTNESS = "70%)";
const DARK_LIGHTNESS = "45%)";

function createModel(onFavoritesPage: boolean, preferences: PreferenceOverrides = {}): TooltipModel {
  return new TooltipModel(createAppContext({ environment: { mode: onFavoritesPage ? "favorites" : "postList" }, preferences }));
}

describe("TooltipModel", () => {
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

  test("replaces the previous highlights on rebuild", () => {
    const model = createModel(true);

    model.rebuildHighlights("red");
    model.rebuildHighlights("blue");
    expect(model.colorForTag("red")).toBeNull();
    expect(model.colorForTag("blue")).not.toBeNull();
  });

  test.each<[ColorScheme, string]>([
    ["light", DARK_LIGHTNESS],
    ["dark", LIGHT_LIGHTNESS]
  ])("uses the color for the color scheme preference (%s)", (colorScheme, lightness) => {
    const model = createModel(true, { app: { colorScheme } });

    model.rebuildHighlights("red");
    expect(model.colorForTag("red")).toMatch(lightness);
  });

  test.each([true, false])("follows only the favorites tooltip preference on the favorites page (%s)", enabled => {
    const model = createModel(true, { favorites: { tooltipEnabled: enabled }, postList: { tooltipEnabled: !enabled } });

    expect(model.tooltipEnabled()).toBe(enabled);
  });

  test.each([true, false])("follows only the post list tooltip preference on the post list page (%s)", enabled => {
    const model = createModel(false, { favorites: { tooltipEnabled: !enabled }, postList: { tooltipEnabled: enabled } });

    expect(model.tooltipEnabled()).toBe(enabled);
  });
});
