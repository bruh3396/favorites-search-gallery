import { ALL_POST_STATUSES_MASK, toPostStatusMask } from "@/core/domain/post/post_status_mask";
import { ALL_RATINGS_MASK, toRatingMask } from "@/core/domain/post/rating_mask";
import { FavoritesSearchSettingsRowDependencies, composeFavoritesSearchSettingsRow } from "@/core/app/favorites/search_settings/favorites_search_settings_row_composer";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { FavoritesSearchSettings } from "@/core/features/favorites/search/favorites_search_settings";
import { OptionMenuClass } from "@/core/ui/components/option_menu/option_menu";
import { Signal } from "@/core/utils/reactive/signal";
import { buildFavoritesSearchSettings } from "@/core/features/favorites/testing/favorites_search_settings_builder";
import { render } from "@/core/ui/h/h";

type FakeFavoritesSession = FavoritesSearchSettingsRowDependencies["favoritesSession"];

interface Setup {
  row: HTMLElement;
  favoritesSession: FakeFavoritesSession;
  searchSettings: Signal<FavoritesSearchSettings>;
  changedSearchSettingCount: Signal<number>;
}

function setup(userOwnsFavorites = true): Setup {
  const searchSettings = new Signal(buildFavoritesSearchSettings());
  const changedSearchSettingCount = new Signal(1);
  const favoritesSession: FakeFavoritesSession = {
    searchSettings,
    changedSearchSettingCount,
    shuffle: vi.fn(),
    invert: vi.fn(),
    toggleBlacklist: vi.fn(),
    updateSearchSettings: vi.fn(),
    resetSearchSettings: vi.fn()
  };
  const { result: row, dispose } = render(document, () => composeFavoritesSearchSettingsRow({ userOwnsFavorites }, { favoritesSession }));

  document.body.append(row);
  onTestFinished(() => {
    dispose();
    row.remove();
  });
  return { row, favoritesSession, searchSettings, changedSearchSettingCount };
}

function queryChip(row: HTMLElement, label: string): HTMLElement | undefined {
  return [...row.querySelectorAll("button")].find(button => button.textContent.startsWith(label));
}

function chooseOption(row: HTMLElement, chipLabel: string, optionLabel: string): void {
  queryChip(row, chipLabel)!.click();
  [...document.querySelectorAll<HTMLElement>(`.${OptionMenuClass.option}`)].find(option => option.textContent === optionLabel)!.click();
}

describe("composeFavoritesSearchSettingsRow", () => {
  test("updates the sort key from the Sort chip", () => {
    const { row, favoritesSession } = setup();

    chooseOption(row, "Sort", "Width");
    expect(favoritesSession.updateSearchSettings).toHaveBeenCalledExactlyOnceWith({ sortKey: "width" });
  });

  test("updates the sort direction from the Sort chip", () => {
    const { row, favoritesSession } = setup();

    chooseOption(row, "Sort", "Ascending");
    expect(favoritesSession.updateSearchSettings).toHaveBeenCalledExactlyOnceWith({ isSortAscending: true });
  });

  test("shuffles from the Shuffle chip", () => {
    const { row, favoritesSession } = setup();

    queryChip(row, "Shuffle")!.click();
    expect(favoritesSession.shuffle).toHaveBeenCalledOnce();
  });

  test("highlights Shuffle while shuffled", () => {
    const { row, searchSettings } = setup();
    const chip = queryChip(row, "Shuffle")!;

    expect(chip.dataset.highlighted).toBe("false");
    searchSettings.value = buildFavoritesSearchSettings({ isShuffled: true });
    expect(chip.dataset.highlighted).toBe("true");
  });

  test("inverts from the Invert chip", () => {
    const { row, favoritesSession } = setup();

    queryChip(row, "Invert")!.click();
    expect(favoritesSession.invert).toHaveBeenCalledOnce();
  });

  test("toggles the blacklist from the Blacklist chip", () => {
    const { row, favoritesSession } = setup();

    queryChip(row, "Blacklist")!.click();
    expect(favoritesSession.toggleBlacklist).toHaveBeenCalledOnce();
  });

  test.each([
    { label: "Invert", change: { isInverted: true } },
    { label: "Blacklist", change: { isBlacklistEnabled: true } }
  ])("presses and highlights $label while on", ({ label, change }) => {
    const { row, searchSettings } = setup();
    const chip = queryChip(row, label)!;
    const readChip = (): [string | null, string | undefined] => [chip.getAttribute("aria-pressed"), chip.dataset.highlighted];
    const before = readChip();

    searchSettings.value = buildFavoritesSearchSettings(change);
    expect([before, readChip()]).toEqual([["false", "false"], ["true", "true"]]);
  });

  test("leaves out Blacklist on someone else's favorites", () => {
    expect(queryChip(setup(false).row, "Blacklist")).toBeUndefined();
  });

  test("updates the allowed statuses from the Status chip", () => {
    const { row, favoritesSession } = setup();

    chooseOption(row, "Status", "Removed");
    expect(favoritesSession.updateSearchSettings).toHaveBeenCalledExactlyOnceWith({ allowedStatuses: ALL_POST_STATUSES_MASK ^ toPostStatusMask("purged") });
  });

  test("turns active and deleted off together from Available", () => {
    const { row, favoritesSession } = setup();

    chooseOption(row, "Status", "Available");
    expect(favoritesSession.updateSearchSettings).toHaveBeenCalledExactlyOnceWith({ allowedStatuses: toPostStatusMask("purged") });
  });

  test.each([
    { allowedStatuses: ALL_POST_STATUSES_MASK, expected: "StatusAll" },
    { allowedStatuses: toPostStatusMask("active") | toPostStatusMask("deleted"), expected: "StatusAvailable" },
    { allowedStatuses: toPostStatusMask("purged"), expected: "StatusRemoved" }
  ])("shows $expected on the Status chip", ({ allowedStatuses, expected }) => {
    const { row, searchSettings } = setup();

    searchSettings.value = buildFavoritesSearchSettings({ allowedStatuses });
    expect(queryChip(row, "Status")!.textContent).toBe(expected);
  });

  test("updates the allowed ratings from the Rating chip", () => {
    const { row, favoritesSession } = setup();

    chooseOption(row, "Rating", "Safe");
    expect(favoritesSession.updateSearchSettings).toHaveBeenCalledExactlyOnceWith({ allowedRatings: ALL_RATINGS_MASK ^ toRatingMask("safe") });
  });

  test.each([
    { allowedRatings: ALL_RATINGS_MASK, expected: "RatingAll" },
    { allowedRatings: toRatingMask("explicit"), expected: "RatingExplicit" },
    { allowedRatings: toRatingMask("questionable"), expected: "RatingQuestionable" },
    { allowedRatings: toRatingMask("safe"), expected: "RatingSafe" }
  ])("shows $expected on the Rating chip", ({ allowedRatings, expected }) => {
    const { row, searchSettings } = setup();

    searchSettings.value = buildFavoritesSearchSettings({ allowedRatings });
    expect(queryChip(row, "Rating")!.textContent).toBe(expected);
  });

  test("resets from Reset", () => {
    const { row, favoritesSession } = setup();

    row.querySelector<HTMLElement>("button[aria-label=\"Reset filters\"]")!.click();
    expect(favoritesSession.resetSearchSettings).toHaveBeenCalledOnce();
  });
});
