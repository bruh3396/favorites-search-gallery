import { describe, expect, test, vi } from "vitest";
import { FavoritesActions } from "@/core/features/favorites/actions/favorites_actions";
import { MemoryLocalFavorites } from "@/adapters/memory/ports/local_favorites/memory_local_favorites";
import { RemoteFavorites } from "@/core/boundary/ports/remote_favorites/remote_favorites";
import { effect } from "@/core/utils/reactive/signal";

type RemoteFavoriteChanges = Pick<RemoteFavorites, "add" | "remove">;

interface Setup {
  actions: FavoritesActions;
  localFavorites: MemoryLocalFavorites;
  remoteFavorites: RemoteFavoriteChanges;
}

function createAnsweringRemote(isAdded: boolean, isRemoved: boolean): RemoteFavoriteChanges {
  return {
    add: vi.fn((): Promise<boolean> => Promise.resolve(isAdded)),
    remove: vi.fn((): Promise<boolean> => Promise.resolve(isRemoved))
  };
}

interface SetupOptions {
  favoritedByDefault?: boolean;
  remoteFavorites?: RemoteFavoriteChanges;
  acceptsChanges?: () => boolean;
}

async function setup({
  favoritedByDefault = true,
  remoteFavorites = createAnsweringRemote(true, true),
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
    const { actions, localFavorites } = await setup({ remoteFavorites: createAnsweringRemote(true, false) });

    expect(await actions.remove("1")).toBe(false);
    expect(actions.isFavorited("1")).toBe(true);
    expect(await localFavorites.getAll()).toEqual(["1", "2"]);
  });

  test("forgets a removed favorite locally", async() => {
    const { actions, localFavorites } = await setup();

    await actions.remove("1");
    expect(await localFavorites.getAll()).toEqual(["2"]);
  });

  test("marks an added favorite as favorited", async() => {
    const { actions } = await setup({ favoritedByDefault: false });

    expect(await actions.add("1")).toBe(true);
    expect(actions.isFavorited("1")).toBe(true);
  });

  test("leaves a favorite unmarked when adding fails", async() => {
    const { actions } = await setup({ favoritedByDefault: false, remoteFavorites: createAnsweringRemote(false, true) });

    expect(await actions.add("1")).toBe(false);
    expect(actions.isFavorited("1")).toBe(false);
  });

  test("blocks adding and removing without a request while it accepts no changes", async() => {
    const { actions, localFavorites, remoteFavorites } = await setup({ acceptsChanges: () => false });

    expect(await actions.add("3")).toBe(false);
    expect(await actions.remove("1")).toBe(false);
    expect(remoteFavorites.add).not.toHaveBeenCalled();
    expect(remoteFavorites.remove).not.toHaveBeenCalled();
    expect(await localFavorites.getAll()).toEqual(["1", "2"]);
  });

  test("checks whether it accepts changes on every call", async() => {
    let isAccepting = false;
    const { actions } = await setup({ acceptsChanges: () => isAccepting });

    expect(await actions.remove("1")).toBe(false);
    isAccepting = true;
    expect(await actions.remove("1")).toBe(true);
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
