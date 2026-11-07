import { FavoritesSearchSettingsRow, FavoritesSearchSettingsRowClass } from "@/core/app/favorites/search_settings/favorites_search_settings_row";
import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import FAVORITES_SEARCH_SETTINGS_ROW_CSS from "@/core/app/favorites/search_settings/favorites_search_settings_row.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css_utilities";

interface Setup {
  row: HTMLElement;
  reset: HTMLButtonElement;
  changedSearchSettingCount: Signal<number>;
  resetSearchSettings: () => void;
}

function setup(): Setup {
  const changedSearchSettingCount = new Signal(0);
  const resetSearchSettings = vi.fn();
  const { result: row } = render(document, () => (
    <FavoritesSearchSettingsRow changedSearchSettingCount={changedSearchSettingCount} resetSearchSettings={resetSearchSettings}>
      <span>Sort</span>
    </FavoritesSearchSettingsRow>
  ));
  return { row, reset: row.querySelector("button")!, changedSearchSettingCount, resetSearchSettings };
}

describe("FavoritesSearchSettingsRow", () => {
  test("shows its children in a group labeled Filters", () => {
    const { row } = setup();

    expect([row.textContent, row.role, row.getAttribute("aria-label")]).toEqual(["Sort", "group", "Filters"]);
  });

  test("enables Reset only while a search setting is changed", () => {
    const { reset, changedSearchSettingCount } = setup();

    expect(reset.disabled).toBe(true);
    changedSearchSettingCount.value = 1;
    expect(reset.disabled).toBe(false);
    changedSearchSettingCount.value = 0;
    expect(reset.disabled).toBe(true);
  });

  test("resets when Reset is pressed", () => {
    const { reset, changedSearchSettingCount, resetSearchSettings } = setup();

    changedSearchSettingCount.value = 2;
    reset.click();
    expect(resetSearchSettings).toHaveBeenCalledOnce();
  });

  test("styles every class it sets", () => {
    expectClassesStyled(FavoritesSearchSettingsRowClass, FAVORITES_SEARCH_SETTINGS_ROW_CSS);
  });
});
