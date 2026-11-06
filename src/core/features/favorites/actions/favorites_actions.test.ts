import { describe, expect, test, vi } from "vitest";
import { FavoritesActions } from "@/core/features/favorites/actions/favorites_actions";
import { MemoryLocalFavorites } from "@/adapters/memory/ports/local_favorites/memory_local_favorites";
import { RemoteFavoriteAddResult } from "@/core/boundary/ports/remote_favorites/remote_favorite_add_result";
import { RemoteFavorites } from "@/core/boundary/ports/remote_favorites/remote_favorites";
import { effect } from "@/core/utils/reactive/signal";

type RemoteFavoriteChanges = Pick<RemoteFavorites, "add" | "remove">;

interface Setup {
  favoritesActions: FavoritesActions;
  localFavorites: MemoryLocalFavorites;
  remoteFavoriteChanges: RemoteFavoriteChanges;
}

interface AnsweringRemoteOptions {
  remoteFavoriteAddResult?: RemoteFavoriteAddResult;
  isRemoved?: boolean;
}

function createAnsweringRemote({ remoteFavoriteAddResult = "added", isRemoved = true }: AnsweringRemoteOptions = {}): RemoteFavoriteChanges {
  return {
    add: vi.fn((): Promise<RemoteFavoriteAddResult> => Promise.resolve(remoteFavoriteAddResult)),
    remove: vi.fn((): Promise<boolean> => Promise.resolve(isRemoved))
  };
}

interface SetupOptions {
  favoritedByDefault?: boolean;
  userLoggedIn?: boolean;
  remoteFavoriteChanges?: RemoteFavoriteChanges;
  acceptsChanges?: () => boolean;
}

async function setup({
  favoritedByDefault = true,
  userLoggedIn = true,
  remoteFavoriteChanges = createAnsweringRemote(),
  acceptsChanges = (): boolean => true
}: SetupOptions = {}): Promise<Setup> {
  const localFavorites = new MemoryLocalFavorites();

  await localFavorites.setAll(["1", "2"]);
  const favoritesActions = new FavoritesActions({ favoritedByDefault, userLoggedIn }, {
    remoteFavorites: remoteFavoriteChanges, localFavorites, acceptsChanges
  });
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
    const { favoritesActions, localFavorites } = await setup({ remoteFavoriteChanges: createAnsweringRemote({ isRemoved: false }) });

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

    expect(await favoritesActions.add("1")).toBe("added");
    expect(favoritesActions.isFavorited("1")).toBe(true);
  });

  test("marks a favorite before the site answers", async() => {
    const remoteFavoriteChanges = { ...createAnsweringRemote(), add: (): Promise<RemoteFavoriteAddResult> => new Promise(() => { }) };
    const { favoritesActions } = await setup({ favoritedByDefault: false, remoteFavoriteChanges });

    favoritesActions.add("1").catch(() => { });
    expect(favoritesActions.isFavorited("1")).toBe(true);
  });

  test("answers loggedOut without a request or a mark when the user is logged out", async() => {
    const { favoritesActions, remoteFavoriteChanges } = await setup({ favoritedByDefault: false, userLoggedIn: false });

    expect(await favoritesActions.add("1")).toBe("loggedOut");
    expect(favoritesActions.isFavorited("1")).toBe(false);
    expect(remoteFavoriteChanges.add).not.toHaveBeenCalled();
  });

  test("sends no request for a post already favorited", async() => {
    const { favoritesActions, remoteFavoriteChanges } = await setup();

    expect(await favoritesActions.add("1")).toBe("added");
    expect(remoteFavoriteChanges.add).not.toHaveBeenCalled();
  });

  test.each<RemoteFavoriteAddResult>(["loggedOut", "failed"])("leaves a favorite unmarked when adding answers %s", async remoteFavoriteAddResult => {
    const { favoritesActions } = await setup({ favoritedByDefault: false, remoteFavoriteChanges: createAnsweringRemote({ remoteFavoriteAddResult }) });

    expect(await favoritesActions.add("1")).toBe(remoteFavoriteAddResult);
    expect(favoritesActions.isFavorited("1")).toBe(false);
  });

  test("blocks adding and removing without a request while it accepts no changes", async() => {
    const { favoritesActions, localFavorites, remoteFavoriteChanges } = await setup({ acceptsChanges: () => false });

    expect(await favoritesActions.add("3")).toBe("blocked");
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
