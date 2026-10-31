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
  checkingMissing: () => "Syncing",
  loaded: state => describeChanges(state.newCount, state.unfavoritedCount),
  interrupted: () => "Couldn't finish loading"
};

export function describeFavoritesLoadState(favoritesLoadState: FavoritesLoadState): string {
  const describe = DESCRIBERS[favoritesLoadState.phase] as (favoritesLoadState: FavoritesLoadState) => string;
  return describe(favoritesLoadState);
}

function describeProgress(loadedCount: number, expectedCount: number | null): string {
  const loaded = loadedCount.toLocaleString();
  return expectedCount === null ? loaded : `${loaded} / ${expectedCount.toLocaleString()}`;
}

function describeChanges(newCount: number, unfavoritedCount: number): string {
  const changes = [
    newCount > 0 ? `${newCount.toLocaleString()} new` : null,
    unfavoritedCount > 0 ? `${unfavoritedCount.toLocaleString()} removed` : null
  ].filter(change => change !== null);
  return changes.join(", ");
}
