import { FavoritesLoadPhase, FavoritesLoadState } from "@/core/features/favorites/load/favorites_load_state";

type Describers = { readonly [Phase in FavoritesLoadPhase]: (state: Extract<FavoritesLoadState, { phase: Phase }>) => string };

const DESCRIBERS: Describers = {
  starting: () => "Starting",
  preparing: () => "Preparing, can take a minute after an update",
  fetching: state => `Fetching ${describeProgress(state.loadedCount, state.expectedCount)}`,
  restoring: state => `Loading ${describeProgress(state.loadedCount, state.expectedCount)}`,
  saving: () => "Saving",
  pulling: () => "Checking for new",
  indexing: () => "Indexing",
  pruning: () => "Syncing",
  loaded: state => describeChanges(state.pulledCount, state.removedCount),
  interrupted: () => "Couldn't finish loading"
};

export function describeFavoritesLoadState(state: FavoritesLoadState): string {
  const describe = DESCRIBERS[state.phase] as (state: FavoritesLoadState) => string;
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
