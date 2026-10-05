export type LoadPhase = "starting" | "fetching" | "restoring" | "syncing" | "loaded";

export interface LoadState {
  phase: LoadPhase;
  loadedCount: number;
  expectedCount: number | null;
}
