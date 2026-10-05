import { describe, expect, test } from "vitest";
import { FavoritesActionsFlow } from "@/core/features/favorites/flows/actions";
import { GatedRemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/gated_remote_favorite_actions";
import { MemoryClient } from "@/adapters/memory/client/client";
import { MemoryRemoteFavoriteActions } from "@/adapters/memory/ports/remote_favorite_actions/remote_favorite_actions";
import { ObservableRemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/observable_remote_favorite_actions";
import { createPost } from "@/testing/post";

function setup(isOpen: () => boolean = (): boolean => true): {
  flow: FavoritesActionsFlow;
  remote: MemoryClient;
  remoteFavoriteActions: ObservableRemoteFavoriteActions;
} {
  const remote = new MemoryClient([createPost({ id: "1" }), createPost({ id: "2" })]);
  const gated = new GatedRemoteFavoriteActions({ remoteFavoriteActions: new MemoryRemoteFavoriteActions(remote), isOpen });
  const remoteFavoriteActions = new ObservableRemoteFavoriteActions(gated);
  const flow = new FavoritesActionsFlow({ remoteFavoriteActions });

  remote.removeFavorite("2");
  remoteFavoriteActions.added.on(id => flow.recordAddition(id));
  remoteFavoriteActions.removed.on(id => flow.recordRemoval(id));
  return { flow, remote, remoteFavoriteActions };
}

function readFavoriteIds(remote: MemoryClient): string[] {
  return remote.readFavorites().map(post => post.id);
}

describe("FavoritesActionsFlow", () => {
  test("starts with no changes", () => {
    const { flow } = setup();

    expect(flow.favoritedChanges.value).toEqual(new Map());
  });

  test("removes a favorite remotely and marks it unfavorited", async() => {
    const { flow, remote } = setup();

    await flow.removeFavorite("1");
    expect(readFavoriteIds(remote)).toEqual([]);
    expect(flow.favoritedChanges.value).toEqual(new Map([["1", false]]));
  });

  test("adds a favorite remotely and marks it favorited", async() => {
    const { flow, remote } = setup();

    await flow.addFavorite("2");
    expect(readFavoriteIds(remote)).toEqual(["2", "1"]);
    expect(flow.favoritedChanges.value).toEqual(new Map([["2", true]]));
  });

  test("marks a favorite favorited again after it is re-added", async() => {
    const { flow } = setup();

    await flow.removeFavorite("1");
    await flow.addFavorite("1");
    expect(flow.favoritedChanges.value).toEqual(new Map([["1", true]]));
  });

  test("records a favorite removed by another caller of the port", async() => {
    const { flow, remoteFavoriteActions } = setup();

    await remoteFavoriteActions.remove("1");
    expect(flow.favoritedChanges.value).toEqual(new Map([["1", false]]));
  });

  test("changes nothing when the port is blocked", async() => {
    const { flow, remote } = setup(() => false);

    await flow.removeFavorite("1");
    await flow.addFavorite("2");
    expect(readFavoriteIds(remote)).toEqual(["1"]);
    expect(flow.favoritedChanges.value).toEqual(new Map());
  });
});
