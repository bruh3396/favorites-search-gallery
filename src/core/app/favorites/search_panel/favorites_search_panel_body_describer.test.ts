import { FavoritesSearchPanelBodyInput, describeFavoritesSearchPanelBody } from "@/core/app/favorites/search_panel/favorites_search_panel_body_describer";
import { describe, expect, test } from "vitest";

function describeWith(overrides: Partial<FavoritesSearchPanelBodyInput>): ReturnType<typeof describeFavoritesSearchPanelBody> {
  return describeFavoritesSearchPanelBody({ resultCount: 0, isSearchable: false, loadPhase: "fetching", query: "", isFiltered: false, ...overrides });
}

describe("describeFavoritesSearchPanelBody", () => {
  test("shows the skeleton while no favorites are searchable and loading continues", () => {
    expect(describeWith({ query: "cat", isFiltered: true })).toEqual({ kind: "skeleton" });
  });

  test("shows the results whenever there are some", () => {
    expect(describeWith({ resultCount: 1 })).toEqual({ kind: "results" });
  });

  test.each([
    { input: { query: "cat", isFiltered: true }, message: "No favorites match \"cat\"", offersClear: true },
    { input: { isFiltered: true }, message: "No favorites match these filters", offersClear: true },
    { input: {}, message: "No favorites yet", offersClear: false }
  ])("says $message once searchable and loaded", ({ input, message, offersClear }) => {
    expect(describeWith({ isSearchable: true, loadPhase: "loaded", ...input })).toEqual({ kind: "empty", message, offersClear });
  });

  test.each([
    { input: { query: "cat", isFiltered: true }, message: "No favorites match \"cat\" yet" },
    { input: { isFiltered: true }, message: "No favorites match these filters yet" }
  ])("says $message while favorites still load", ({ input, message }) => {
    expect(describeWith({ isSearchable: true, ...input })).toEqual({ kind: "empty", message, offersClear: true });
  });

  test("says there are no favorites, ignoring the filters, when loading finishes without any", () => {
    expect(describeWith({ loadPhase: "loaded", query: "cat", isFiltered: true })).toEqual({ kind: "empty", message: "No favorites yet", offersClear: false });
  });

  test("reports the failure when loading stops before any favorite is searchable", () => {
    expect(describeWith({ loadPhase: "interrupted" })).toEqual({ kind: "empty", message: "Couldn't load favorites", offersClear: false });
  });

  test("treats an interrupted load with searchable favorites as a search without matches", () => {
    expect(describeWith({ isSearchable: true, loadPhase: "interrupted", query: "cat", isFiltered: true })).toEqual({
      kind: "empty", message: "No favorites match \"cat\"", offersClear: true
    });
  });
});
