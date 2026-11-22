import { ALL_POST_STATUSES_MASK, toPostStatusMask } from "@/core/domain/post/post_status_mask";
import { ALL_RATINGS_MASK, toRatingMask } from "@/core/domain/post/rating_mask";
import { FavoritesSearchOptionsRowDependencies, composeFavoritesSearchOptionsRow } from "@/core/app/favorites/search_options/favorites_search_options_row_composer";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { FavoritesSearchOptions } from "@/core/features/favorites/search/favorites_search_options";
import { OptionMenuClass } from "@/core/ui/components/option_menu/option_menu";
import { Signal } from "@/core/utils/reactive/signal";
import { buildFavoritesSearchOptions } from "@/core/features/favorites/testing/favorites_search_options_builder";
import { render } from "@/core/ui/h/h";

type FakeFavoritesSession = FavoritesSearchOptionsRowDependencies["favoritesSession"];

interface Setup {
  row: HTMLElement;
  favoritesSession: FakeFavoritesSession;
  searchOptions: Signal<FavoritesSearchOptions>;
  changedSearchOptionCount: Signal<number>;
}

function setup(userOwnsFavorites = true): Setup {
  const searchOptions = new Signal(buildFavoritesSearchOptions());
  const changedSearchOptionCount = new Signal(1);
  const favoritesSession: FakeFavoritesSession = {
    searchOptions,
    changedSearchOptionCount,
    shuffle: vi.fn(),
    invert: vi.fn(),
    toggleBlacklist: vi.fn(),
    updateSearchOptions: vi.fn(),
    resetSearchOptions: vi.fn()
  };
  const { result: row, dispose } = render(document, () => composeFavoritesSearchOptionsRow({ userOwnsFavorites }, { favoritesSession }));

  document.body.append(row);
  onTestFinished(() => {
    dispose();
    row.remove();
  });
  return { row, favoritesSession, searchOptions, changedSearchOptionCount };
}

function queryChip(row: HTMLElement, label: string): HTMLElement | undefined {
  return [...row.querySelectorAll("button")].find(button => button.textContent.startsWith(label));
}

function chooseOption(row: HTMLElement, chipLabel: string, optionLabel: string): void {
  queryChip(row, chipLabel)!.click();
  [...document.querySelectorAll<HTMLElement>(`.${OptionMenuClass.option}`)].find(option => option.textContent === optionLabel)!.click();
}

describe("composeFavoritesSearchOptionsRow", () => {
  test("updates the sort key from the Sort chip", () => {
    const { row, favoritesSession } = setup();

    chooseOption(row, "Sort", "Width");
    expect(favoritesSession.updateSearchOptions).toHaveBeenCalledExactlyOnceWith({ sortKey: "width" });
  });

  test("updates the sort direction from the Sort chip", () => {
    const { row, favoritesSession } = setup();

    chooseOption(row, "Sort", "Ascending");
    expect(favoritesSession.updateSearchOptions).toHaveBeenCalledExactlyOnceWith({ isSortAscending: true });
  });

  test("shuffles from the Shuffle chip", () => {
    const { row, favoritesSession } = setup();

    queryChip(row, "Shuffle")!.click();
    expect(favoritesSession.shuffle).toHaveBeenCalledOnce();
  });

  test("highlights Shuffle while shuffled", () => {
    const { row, searchOptions } = setup();
    const chip = queryChip(row, "Shuffle")!;

    expect(chip.dataset.highlighted).toBe("false");
    searchOptions.value = buildFavoritesSearchOptions({ isShuffled: true });
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
    const { row, searchOptions } = setup();
    const chip = queryChip(row, label)!;
    const readChip = (): [string | null, string | undefined] => [chip.getAttribute("aria-pressed"), chip.dataset.highlighted];
    const before = readChip();

    searchOptions.value = buildFavoritesSearchOptions(change);
    expect([before, readChip()]).toEqual([["false", "false"], ["true", "true"]]);
  });

  test("leaves out Blacklist on someone else's favorites", () => {
    expect(queryChip(setup(false).row, "Blacklist")).toBeUndefined();
  });

  test("updates the allowed statuses from the Status chip", () => {
    const { row, favoritesSession } = setup();

    chooseOption(row, "Status", "Removed");
    expect(favoritesSession.updateSearchOptions).toHaveBeenCalledExactlyOnceWith({ allowedStatuses: ALL_POST_STATUSES_MASK ^ toPostStatusMask("purged") });
  });

  test("turns active and deleted off together from Available", () => {
    const { row, favoritesSession } = setup();

    chooseOption(row, "Status", "Available");
    expect(favoritesSession.updateSearchOptions).toHaveBeenCalledExactlyOnceWith({ allowedStatuses: toPostStatusMask("purged") });
  });

  test.each([
    { allowedStatuses: ALL_POST_STATUSES_MASK, expected: "StatusAll" },
    { allowedStatuses: toPostStatusMask("active") | toPostStatusMask("deleted"), expected: "StatusAvailable" },
    { allowedStatuses: toPostStatusMask("purged"), expected: "StatusRemoved" }
  ])("shows $expected on the Status chip", ({ allowedStatuses, expected }) => {
    const { row, searchOptions } = setup();

    searchOptions.value = buildFavoritesSearchOptions({ allowedStatuses });
    expect(queryChip(row, "Status")!.textContent).toBe(expected);
  });

  test("updates the allowed ratings from the Rating chip", () => {
    const { row, favoritesSession } = setup();

    chooseOption(row, "Rating", "Safe");
    expect(favoritesSession.updateSearchOptions).toHaveBeenCalledExactlyOnceWith({ allowedRatings: ALL_RATINGS_MASK ^ toRatingMask("safe") });
  });

  test.each([
    { allowedRatings: ALL_RATINGS_MASK, expected: "RatingAll" },
    { allowedRatings: toRatingMask("explicit"), expected: "RatingExplicit" },
    { allowedRatings: toRatingMask("questionable"), expected: "RatingQuestionable" },
    { allowedRatings: toRatingMask("safe"), expected: "RatingSafe" }
  ])("shows $expected on the Rating chip", ({ allowedRatings, expected }) => {
    const { row, searchOptions } = setup();

    searchOptions.value = buildFavoritesSearchOptions({ allowedRatings });
    expect(queryChip(row, "Rating")!.textContent).toBe(expected);
  });

  test("resets from Reset", () => {
    const { row, favoritesSession } = setup();

    row.querySelector<HTMLElement>("button[aria-label=\"Reset Search Options\"]")!.click();
    expect(favoritesSession.resetSearchOptions).toHaveBeenCalledOnce();
  });
});
