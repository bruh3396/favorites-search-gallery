import { AddFavoriteResult, RemoteFavoriteActions, RemoveFavoriteResult } from "@/core/boundary/ports/remote_favorite_actions/remote_favorite_actions";
import { describe, expect, test } from "vitest";
import { FavoritesActions } from "@/core/features/favorites/actions/actions";
import { MemoryLocalFavorites } from "@/adapters/memory/ports/local_favorites/local_favorites";
import { ObservableRemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/observable_remote_favorite_actions";
import { effect } from "@/core/utils/reactive/signal";

interface Setup {
  actions: FavoritesActions;
  localFavorites: MemoryLocalFavorites;
}

function createAnsweringActions(addResult: AddFavoriteResult, removeResult: RemoveFavoriteResult): RemoteFavoriteActions {
  return {
    add: (): Promise<AddFavoriteResult> => Promise.resolve(addResult),
    remove: (): Promise<RemoveFavoriteResult> => Promise.resolve(removeResult)
  };
}

async function setup(favoritedByDefault = true, remoteFavoriteActions = createAnsweringActions("added", "removed")): Promise<Setup> {
  const localFavorites = new MemoryLocalFavorites();

  await localFavorites.setAll(["1", "2"]);
  const actions = new FavoritesActions({ favoritedByDefault }, {
    remoteFavoriteActions: new ObservableRemoteFavoriteActions(remoteFavoriteActions),
    localFavorites
  });
  return { actions, localFavorites };
}

describe("FavoritesActions", () => {
  test.each([true, false])("returns the default %s for an untouched favorite", async favoritedByDefault => {
    const { actions } = await setup(favoritedByDefault);

    expect(actions.isFavorited("1")).toBe(favoritedByDefault);
  });

  test("returns the latest addition or removal", async() => {
    const { actions } = await setup();

    await actions.remove("1");
    expect(actions.isFavorited("1")).toBe(false);
    await actions.add("1");
    expect(actions.isFavorited("1")).toBe(true);
  });

  test("keeps the other favorites at the default", async() => {
    const { actions } = await setup();

    await actions.remove("1");
    expect(actions.isFavorited("2")).toBe(true);
  });

  test("keeps a favorite whose removal fails", async() => {
    const { actions, localFavorites } = await setup(true, createAnsweringActions("added", "error"));

    expect(await actions.remove("1")).toBe("error");
    expect(actions.isFavorited("1")).toBe(true);
    expect(await localFavorites.getAll()).toEqual(["1", "2"]);
  });

  test("forgets a removed favorite locally", async() => {
    const { actions, localFavorites } = await setup();

    await actions.remove("1");
    expect(await localFavorites.getAll()).toEqual(["2"]);
  });

  test("reruns an effect that reads it when the favorite changes", async() => {
    const { actions } = await setup();
    const seen: boolean[] = [];
    const stop = effect(() => {
      seen.push(actions.isFavorited("1"));
    });

    await actions.remove("1");
    expect(seen).toEqual([true, false]);
    stop();
  });

  test("leaves an effect that reads another favorite alone", async() => {
    const { actions } = await setup();
    const seen: boolean[] = [];
    const stop = effect(() => {
      seen.push(actions.isFavorited("2"));
    });

    await actions.remove("1");
    expect(seen).toEqual([true]);
    stop();
  });

  test("stops following changes once disposed", async() => {
    const { actions, localFavorites } = await setup();

    actions.dispose();
    await actions.remove("1");
    expect(actions.isFavorited("1")).toBe(true);
    expect(await localFavorites.getAll()).toEqual(["1", "2"]);
  });
});
