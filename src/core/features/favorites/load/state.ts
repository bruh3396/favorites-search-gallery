export type LoadState =
  | { readonly phase: "starting" }
  | { readonly phase: "fetching"; readonly loadedCount: number; readonly expectedCount: number | null }
  | { readonly phase: "restoring"; readonly loadedCount: number; readonly expectedCount: number }
  | { readonly phase: "saving" }
  | { readonly phase: "pulling" }
  | { readonly phase: "indexing" }
  | { readonly phase: "pruning" }
  | { readonly phase: "loaded"; readonly pulledCount: number; readonly removedCount: number }
  | { readonly phase: "interrupted" };

export type LoadPhase = LoadState["phase"];

export interface LoadResult {
  readonly pulledCount: number;
  readonly removedCount: number;
}
