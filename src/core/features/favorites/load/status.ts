import { LoadPhase, LoadState } from "@/core/features/favorites/load/state";

type Describers = { readonly [Phase in LoadPhase]: (state: Extract<LoadState, { phase: Phase }>) => string };

const DESCRIBERS: Describers = {
  starting: () => "Starting",
  fetching: state => `Fetching ${describeProgress(state.loadedCount, state.expectedCount)}`,
  restoring: state => `Loading ${describeProgress(state.loadedCount, state.expectedCount)}`,
  saving: () => "Saving",
  pulling: () => "Checking for new",
  indexing: () => "Indexing",
  pruning: () => "Checking for removed",
  loaded: state => describeChanges(state.pulledCount, state.removedCount),
  interrupted: () => "Couldn't finish loading"
};

export function describeLoadState(state: LoadState): string {
  const describe = DESCRIBERS[state.phase] as (state: LoadState) => string;
  return describe(state);
}

function describeProgress(loadedCount: number, expectedCount: number | null): string {
  const loaded = loadedCount.toLocaleString();
  return expectedCount === null ? loaded : `${loaded} / ${expectedCount.toLocaleString()}`;
}

function describeChanges(pulledCount: number, removedCount: number): string {
  const changes = [
    pulledCount > 0 ? `${pulledCount.toLocaleString()} new` : null,
    removedCount > 0 ? `${removedCount.toLocaleString()} removed` : null
  ].filter(change => change !== null);
  return changes.join(", ");
}
