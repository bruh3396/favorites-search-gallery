import { describe, expect, test } from "vitest";
import { TooltipVisibility } from "@/features/tooltip/model/visibility";

function createVisibility(onFavoritesPage: boolean, favoritesTooltipEnabled: boolean, postListTooltipEnabled: boolean): TooltipVisibility {
  return new TooltipVisibility({
    onFavoritesPage,
    favoritesTooltipEnabled: () => favoritesTooltipEnabled,
    postListTooltipEnabled: () => postListTooltipEnabled
  });
}

describe("TooltipVisibility", () => {
  test("follows the favorites setting on the favorites page", () => {
    expect(createVisibility(true, true, false).isEnabled()).toBe(true);
    expect(createVisibility(true, false, true).isEnabled()).toBe(false);
  });

  test("follows the post list setting on a post list page", () => {
    expect(createVisibility(false, false, true).isEnabled()).toBe(true);
    expect(createVisibility(false, true, false).isEnabled()).toBe(false);
  });

  test("reads the setting at call time", () => {
    let isEnabled = false;
    const tooltip = new TooltipVisibility({ onFavoritesPage: true, favoritesTooltipEnabled: (): boolean => isEnabled, postListTooltipEnabled: (): boolean => false });

    expect(tooltip.isEnabled()).toBe(false);
    isEnabled = true;
    expect(tooltip.isEnabled()).toBe(true);
  });
});
