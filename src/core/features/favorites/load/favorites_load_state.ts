export type FavoritesLoadState =
  | { readonly phase: "starting" }
  | { readonly phase: "preparing" }
  | { readonly phase: "fetching"; readonly loadedCount: number; readonly expectedCount: number | null }
  | { readonly phase: "restoring"; readonly loadedCount: number; readonly expectedCount: number }
  | { readonly phase: "saving" }
  | { readonly phase: "pulling" }
  | { readonly phase: "indexing" }
  | { readonly phase: "checkingMissing" }
  | { readonly phase: "loaded"; readonly newCount: number; readonly unfavoritedCount: number }
  | { readonly phase: "interrupted" };

export type FavoritesLoadPhase = FavoritesLoadState["phase"];
