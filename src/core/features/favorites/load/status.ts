import { LoadPhase, LoadState } from "@/core/features/favorites/load/state";

type Describers = { [Phase in LoadPhase]: (state: Extract<LoadState, { phase: Phase }>) => string };

const DESCRIBERS: Describers = {
  starting: () => "Starting",
  fetching: state => `Fetching favorites: ${describeProgress(state.loadedCount, state.expectedCount)}`,
  restoring: state => `Loading favorites: ${describeProgress(state.loadedCount, state.expectedCount)}`,
  saving: () => "Saving favorites",
  pulling: () => "Checking for new favorites",
  indexing: () => "Indexing favorites",
  pruning: () => "Checking for removed favorites",
  loaded: state => describeChanges(state.pulledCount, state.removedCount),
  interrupted: () => "Couldn't finish loading favorites"
};

export function describeLoadState(state: LoadState): string {
  const describe = DESCRIBERS[state.phase] as (state: LoadState) => string;
  return describe(state);
}

function describeProgress(loadedCount: number, expectedCount: number | null): string {
  return expectedCount === null ? `${loadedCount}` : `${loadedCount} / ${expectedCount}`;
}

function describeChanges(pulledCount: number, removedCount: number): string {
  const changes = [
    pulledCount > 0 ? `${pulledCount} new` : null,
    removedCount > 0 ? `${removedCount} removed` : null
  ].filter(change => change !== null);
  return changes.join(", ");
}
