export type LoadState =
  | { phase: "starting" }
  | { phase: "fetching"; loadedCount: number; expectedCount: number | null }
  | { phase: "restoring"; loadedCount: number; expectedCount: number }
  | { phase: "saving" }
  | { phase: "pulling" }
  | { phase: "indexing" }
  | { phase: "pruning" }
  | { phase: "loaded"; pulledCount: number; removedCount: number }
  | { phase: "interrupted" };

export type LoadPhase = LoadState["phase"];

export interface LoadResult {
  pulledCount: number;
  removedCount: number;
}
