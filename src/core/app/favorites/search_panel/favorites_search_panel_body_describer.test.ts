import { describe, expect, test } from "vitest";
import { describeFavoritesSearchPanelBody } from "@/core/app/favorites/search_panel/favorites_search_panel_body_describer";

type FavoritesSearchPanelBodyInput = Parameters<typeof describeFavoritesSearchPanelBody>[0];

function describeWith(partialFavoritesSearchPanelBodyInput: Partial<FavoritesSearchPanelBodyInput>): ReturnType<typeof describeFavoritesSearchPanelBody> {
  return describeFavoritesSearchPanelBody({
    resultCount: 0, isSearchable: false, loadPhase: "fetching", isFiltered: false, ...partialFavoritesSearchPanelBodyInput
  });
}

describe("describeFavoritesSearchPanelBody", () => {
  test("shows the skeleton while no favorites are searchable and loading continues", () => {
    expect(describeWith({ isFiltered: true })).toEqual({ kind: "skeleton" });
  });

  test("shows the results whenever there are some", () => {
    expect(describeWith({ resultCount: 1 })).toEqual({ kind: "results" });
  });

  test.each([
    { input: { isFiltered: true }, message: "No matching favorites", offersClear: true },
    { input: {}, message: "No favorites yet", offersClear: false }
  ])("says $message once searchable and loaded", ({ input, message, offersClear }) => {
    expect(describeWith({ isSearchable: true, loadPhase: "loaded", ...input })).toEqual({ kind: "empty", message, offersClear });
  });

  test("says nothing matches yet while favorites still load", () => {
    expect(describeWith({ isSearchable: true, isFiltered: true })).toEqual({ kind: "empty", message: "No matching favorites yet", offersClear: true });
  });

  test("says there are no favorites, ignoring the filters, when loading finishes without any", () => {
    expect(describeWith({ loadPhase: "loaded", isFiltered: true })).toEqual({ kind: "empty", message: "No favorites yet", offersClear: false });
  });

  test("reports the failure when loading stops before any favorite is searchable", () => {
    expect(describeWith({ loadPhase: "interrupted" })).toEqual({ kind: "empty", message: "Couldn't load favorites", offersClear: false });
  });

  test("treats an interrupted load with searchable favorites as a search without matches", () => {
    expect(describeWith({ isSearchable: true, loadPhase: "interrupted", isFiltered: true })).toEqual({
      kind: "empty", message: "No matching favorites", offersClear: true
    });
  });
});
