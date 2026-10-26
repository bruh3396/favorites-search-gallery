import { AddFavoriteResult, RemoteFavorites, RemoveFavoriteResult } from "@/core/boundary/ports/remote_favorites/remote_favorites";
import { describe, expect, test, vi } from "vitest";
import { FavoritesActions } from "@/core/features/favorites/actions/favorites_actions";
import { MemoryLocalFavorites } from "@/adapters/memory/ports/local_favorites/local_favorites";
import { effect } from "@/core/utils/reactive/signal";

type RemoteFavoriteChanges = Pick<RemoteFavorites, "add" | "remove">;

interface Setup {
  actions: FavoritesActions;
  localFavorites: MemoryLocalFavorites;
  remoteFavorites: RemoteFavoriteChanges;
}

function createAnsweringRemote(addResult: AddFavoriteResult, removeResult: RemoveFavoriteResult): RemoteFavoriteChanges {
  return {
    add: vi.fn((): Promise<AddFavoriteResult> => Promise.resolve(addResult)),
    remove: vi.fn((): Promise<RemoveFavoriteResult> => Promise.resolve(removeResult))
  };
}

interface SetupOptions {
  favoritedByDefault?: boolean;
  remoteFavorites?: RemoteFavoriteChanges;
  acceptsChanges?: () => boolean;
}

async function setup({
  favoritedByDefault = true,
  remoteFavorites = createAnsweringRemote("added", "removed"),
  acceptsChanges = (): boolean => true
}: SetupOptions = {}): Promise<Setup> {
  const localFavorites = new MemoryLocalFavorites();

  await localFavorites.setAll(["1", "2"]);
  const actions = new FavoritesActions({ favoritedByDefault }, { remoteFavorites, localFavorites, acceptsChanges });
  return { actions, localFavorites, remoteFavorites };
}

describe("FavoritesActions", () => {
  test.each([true, false])("returns the default %s for an untouched favorite", async favoritedByDefault => {
    const { actions } = await setup({ favoritedByDefault });

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
    const { actions, localFavorites } = await setup({ remoteFavorites: createAnsweringRemote("added", "error") });

    expect(await actions.remove("1")).toBe("error");
    expect(actions.isFavorited("1")).toBe(true);
    expect(await localFavorites.getAll()).toEqual(["1", "2"]);
  });

  test("forgets a removed favorite locally", async() => {
    const { actions, localFavorites } = await setup();

    await actions.remove("1");
    expect(await localFavorites.getAll()).toEqual(["2"]);
  });

  test("marks a favorite that was already added as favorited", async() => {
    const { actions } = await setup({ favoritedByDefault: false, remoteFavorites: createAnsweringRemote("alreadyAdded", "removed") });

    expect(await actions.add("1")).toBe("alreadyAdded");
    expect(actions.isFavorited("1")).toBe(true);
  });

  test.each<AddFavoriteResult>(["loggedOut", "cancelled", "error"])("leaves a favorite unmarked when adding answers %s", async result => {
    const { actions } = await setup({ favoritedByDefault: false, remoteFavorites: createAnsweringRemote(result, "removed") });

    expect(await actions.add("1")).toBe(result);
    expect(actions.isFavorited("1")).toBe(false);
  });

  test.each<RemoveFavoriteResult>(["cancelled", "error"])("keeps a favorite when removing answers %s", async result => {
    const { actions } = await setup({ remoteFavorites: createAnsweringRemote("added", result) });

    expect(await actions.remove("1")).toBe(result);
    expect(actions.isFavorited("1")).toBe(true);
  });

  test("blocks adding and removing without a request while it accepts no changes", async() => {
    const { actions, localFavorites, remoteFavorites } = await setup({ acceptsChanges: () => false });

    expect(await actions.add("3")).toBe("blocked");
    expect(await actions.remove("1")).toBe("blocked");
    expect(remoteFavorites.add).not.toHaveBeenCalled();
    expect(remoteFavorites.remove).not.toHaveBeenCalled();
    expect(await localFavorites.getAll()).toEqual(["1", "2"]);
  });

  test("checks whether it accepts changes on every call", async() => {
    let isAccepting = false;
    const { actions } = await setup({ acceptsChanges: () => isAccepting });

    expect(await actions.remove("1")).toBe("blocked");
    isAccepting = true;
    expect(await actions.remove("1")).toBe("removed");
  });

  test("reruns an effect that reads it when it changes", async() => {
    const { actions } = await setup();

    await actions.remove("1");
    const seen: boolean[] = [];
    const stop = effect(() => {
      seen.push(actions.isFavorited("1"));
    });

    await actions.add("1");
    expect(seen).toEqual([false, true]);
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
});
