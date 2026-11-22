import { Mock, describe, expect, onTestFinished, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { FavoritesSearchSettings } from "@/core/features/favorites/search/favorites_search_settings";
import { FavoritesSortChip } from "@/core/app/favorites/search_settings/favorites_sort_chip";
import { FavoritesSortKey } from "@/core/features/favorites/search/favorites_sort_key";
import { OptionMenuClass } from "@/core/ui/components/option_menu/option_menu";
import { Signal } from "@/core/utils/reactive/signal";
import { buildFavoritesSearchSettings } from "@/core/features/favorites/testing/favorites_search_settings_builder";

interface Setup {
  chip: HTMLElement;
  onSortKeyChange: Mock<(sortKey: FavoritesSortKey) => void>;
  onSortAscendingChange: Mock<(isSortAscending: boolean) => void>;
}

function setup(partialFavoritesSearchSettings: Partial<FavoritesSearchSettings> = {}): Setup {
  const favoritesSearchSettings = new Signal(buildFavoritesSearchSettings(partialFavoritesSearchSettings));
  const onSortKeyChange = vi.fn<(sortKey: FavoritesSortKey) => void>();
  const onSortAscendingChange = vi.fn<(isSortAscending: boolean) => void>();
  const { result: chip, dispose } = render(document, () => (
    <FavoritesSortChip favoritesSearchSettings={favoritesSearchSettings} onSortKeyChange={onSortKeyChange} onSortAscendingChange={onSortAscendingChange} />
  ));
  const container = document.createElement("div");

  container.append(chip);
  document.body.append(container);
  onTestFinished(() => {
    dispose();
    container.remove();
  });
  return { chip, onSortKeyChange, onSortAscendingChange };
}

function queryOptions(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>(`.${OptionMenuClass.option}`)];
}

function queryOption(label: string): HTMLElement {
  return queryOptions().find(option => option.textContent === label)!;
}

describe("FavoritesSortChip", () => {
  test.each([
    { change: {}, expected: "SortFavorited ↓" },
    { change: { sortKey: "score", isSortAscending: true }, expected: "SortScore ↑" },
    { change: { sortKey: "random" }, expected: "SortRandom" },
    { change: { sortKey: "score", isShuffled: true }, expected: "SortShuffled" }
  ] as const)("shows $expected", ({ change, expected }) => {
    expect(setup(change).chip.textContent).toBe(expected);
  });

  test.each([
    { change: {}, highlighted: "false" },
    { change: { sortKey: "score" }, highlighted: "true" },
    { change: { isSortAscending: true }, highlighted: "true" },
    { change: { isShuffled: true }, highlighted: "true" }
  ] as const)("highlights as $highlighted after changing $change", ({ change, highlighted }) => {
    expect(setup(change).chip.dataset.highlighted).toBe(highlighted);
  });

  test("offers every sort, Random last, then Ascending", () => {
    setup().chip.click();
    expect(queryOptions().map(option => option.textContent))
      .toEqual(["Favorited", "Uploaded", "Score", "Width", "Height", "Duration", "Changed", "Random", "Ascending"]);
  });

  test("marks the current sort", () => {
    setup({ sortKey: "score" }).chip.click();
    expect(queryOption("Score").getAttribute("aria-selected")).toBe("true");
  });

  test("marks no sort while shuffled", () => {
    setup({ sortKey: "score", isShuffled: true }).chip.click();
    expect(queryOption("Score").getAttribute("aria-selected")).toBe("false");
  });

  test("reports a picked sort and closes", () => {
    const { chip, onSortKeyChange } = setup();

    chip.click();
    queryOption("Width").click();
    expect(onSortKeyChange).toHaveBeenCalledExactlyOnceWith("width");
    expect(queryOptions()).toEqual([]);
  });

  test("reports the flipped direction and stays open", () => {
    const { chip, onSortAscendingChange } = setup({ isSortAscending: true });

    chip.click();
    queryOption("Ascending").click();
    expect(onSortAscendingChange).toHaveBeenCalledExactlyOnceWith(false);
    expect(queryOptions()).not.toEqual([]);
  });

  test("disables Ascending under Random", () => {
    const { chip, onSortAscendingChange } = setup({ sortKey: "random" });

    chip.click();
    queryOption("Ascending").click();
    expect(queryOption("Ascending").getAttribute("aria-disabled")).toBe("true");
    expect(onSortAscendingChange).not.toHaveBeenCalled();
  });
});
