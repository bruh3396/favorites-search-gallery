import { describe, expect, test, vi } from "vitest";
import { FavoritesActions } from "@/core/features/favorites/actions/favorites_actions";
import { MemoryLocalFavorites } from "@/adapters/memory/ports/local_favorites/memory_local_favorites";
import { RemoteFavorites } from "@/core/boundary/ports/remote_favorites/remote_favorites";
import { effect } from "@/core/utils/reactive/signal";

type RemoteFavoriteChanges = Pick<RemoteFavorites, "add" | "remove">;

interface Setup {
  favoritesActions: FavoritesActions;
  localFavorites: MemoryLocalFavorites;
  remoteFavoriteChanges: RemoteFavoriteChanges;
}

function createAnsweringRemote(isAdded: boolean, isRemoved: boolean): RemoteFavoriteChanges {
  return {
    add: vi.fn((): Promise<boolean> => Promise.resolve(isAdded)),
    remove: vi.fn((): Promise<boolean> => Promise.resolve(isRemoved))
  };
}

interface SetupOptions {
  favoritedByDefault?: boolean;
  remoteFavoriteChanges?: RemoteFavoriteChanges;
  acceptsChanges?: () => boolean;
}

async function setup({
  favoritedByDefault = true,
  remoteFavoriteChanges = createAnsweringRemote(true, true),
  acceptsChanges = (): boolean => true
}: SetupOptions = {}): Promise<Setup> {
  const localFavorites = new MemoryLocalFavorites();

  await localFavorites.setAll(["1", "2"]);
  const favoritesActions = new FavoritesActions({ favoritedByDefault }, { remoteFavorites: remoteFavoriteChanges, localFavorites, acceptsChanges });
  return { favoritesActions, localFavorites, remoteFavoriteChanges };
}

describe("FavoritesActions", () => {
  test.each([true, false])("returns the default %s for an untouched favorite", async favoritedByDefault => {
    const { favoritesActions } = await setup({ favoritedByDefault });

    expect(favoritesActions.isFavorited("1")).toBe(favoritedByDefault);
  });

  test("returns the latest addition or removal", async() => {
    const { favoritesActions } = await setup();

    await favoritesActions.remove("1");
    expect(favoritesActions.isFavorited("1")).toBe(false);
    await favoritesActions.add("1");
    expect(favoritesActions.isFavorited("1")).toBe(true);
  });

  test("keeps the other favorites at the default", async() => {
    const { favoritesActions } = await setup();

    await favoritesActions.remove("1");
    expect(favoritesActions.isFavorited("2")).toBe(true);
  });

  test("keeps a favorite whose removal fails", async() => {
    const { favoritesActions, localFavorites } = await setup({ remoteFavoriteChanges: createAnsweringRemote(true, false) });

    expect(await favoritesActions.remove("1")).toBe(false);
    expect(favoritesActions.isFavorited("1")).toBe(true);
    expect(await localFavorites.getAll()).toEqual(["1", "2"]);
  });

  test("forgets a removed favorite locally", async() => {
    const { favoritesActions, localFavorites } = await setup();

    await favoritesActions.remove("1");
    expect(await localFavorites.getAll()).toEqual(["2"]);
  });

  test("marks an added favorite as favorited", async() => {
    const { favoritesActions } = await setup({ favoritedByDefault: false });

    expect(await favoritesActions.add("1")).toBe(true);
    expect(favoritesActions.isFavorited("1")).toBe(true);
  });

  test("leaves a favorite unmarked when adding fails", async() => {
    const { favoritesActions } = await setup({ favoritedByDefault: false, remoteFavoriteChanges: createAnsweringRemote(false, true) });

    expect(await favoritesActions.add("1")).toBe(false);
    expect(favoritesActions.isFavorited("1")).toBe(false);
  });

  test("blocks adding and removing without a request while it accepts no changes", async() => {
    const { favoritesActions, localFavorites, remoteFavoriteChanges } = await setup({ acceptsChanges: () => false });

    expect(await favoritesActions.add("3")).toBe(false);
    expect(await favoritesActions.remove("1")).toBe(false);
    expect(remoteFavoriteChanges.add).not.toHaveBeenCalled();
    expect(remoteFavoriteChanges.remove).not.toHaveBeenCalled();
    expect(await localFavorites.getAll()).toEqual(["1", "2"]);
  });

  test("checks whether it accepts changes on every call", async() => {
    let isAccepting = false;
    const { favoritesActions } = await setup({ acceptsChanges: () => isAccepting });

    expect(await favoritesActions.remove("1")).toBe(false);
    isAccepting = true;
    expect(await favoritesActions.remove("1")).toBe(true);
  });

  test("reruns an effect that reads it when it changes", async() => {
    const { favoritesActions } = await setup();

    await favoritesActions.remove("1");
    const seen: boolean[] = [];
    const stop = effect(() => {
      seen.push(favoritesActions.isFavorited("1"));
    });

    await favoritesActions.add("1");
    expect(seen).toEqual([false, true]);
    stop();
  });

  test("leaves an effect that reads another favorite alone", async() => {
    const { favoritesActions } = await setup();
    const seen: boolean[] = [];
    const stop = effect(() => {
      seen.push(favoritesActions.isFavorited("2"));
    });

    await favoritesActions.remove("1");
    expect(seen).toEqual([true]);
    stop();
  });
});
