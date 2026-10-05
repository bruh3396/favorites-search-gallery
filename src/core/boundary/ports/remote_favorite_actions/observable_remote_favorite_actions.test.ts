import { AddFavoriteResult, RemoteFavoriteActions, RemoveFavoriteResult } from "@/core/boundary/ports/remote_favorite_actions/remote_favorite_actions";
import { describe, expect, test } from "vitest";
import { GatedRemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/gated_remote_favorite_actions";
import { MemoryClient } from "@/adapters/memory/client/client";
import { MemoryRemoteFavoriteActions } from "@/adapters/memory/ports/remote_favorite_actions/remote_favorite_actions";
import { ObservableRemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/observable_remote_favorite_actions";
import { createPost } from "@/testing/post";

interface Heard {
  added: string[];
  removed: string[];
}

function listen(observable: ObservableRemoteFavoriteActions): Heard {
  const heard: Heard = { added: [], removed: [] };

  observable.added.on(id => heard.added.push(id));
  observable.removed.on(id => heard.removed.push(id));
  return heard;
}

function setup(isOpen: () => boolean): { remote: MemoryClient; observable: ObservableRemoteFavoriteActions; heard: Heard } {
  const remote = new MemoryClient([createPost({ id: "1" }), createPost({ id: "2" })]);

  remote.removeFavorite("2");
  const gated = new GatedRemoteFavoriteActions({ remoteFavoriteActions: new MemoryRemoteFavoriteActions(remote), isOpen });
  const observable = new ObservableRemoteFavoriteActions(gated);
  return { remote, observable, heard: listen(observable) };
}

function createAnsweringActions(addResult: AddFavoriteResult, removeResult: RemoveFavoriteResult): RemoteFavoriteActions {
  return {
    add: (): Promise<AddFavoriteResult> => Promise.resolve(addResult),
    remove: (): Promise<RemoveFavoriteResult> => Promise.resolve(removeResult)
  };
}

describe("ObservableRemoteFavoriteActions", () => {
  test("announces a favorite it adds or removes", async() => {
    const { remote, observable, heard } = setup(() => true);

    expect(await observable.add("2")).toBe("added");
    expect(await observable.remove("1")).toBe("removed");
    expect(heard).toEqual({ added: ["2"], removed: ["1"] });
    expect(remote.readFavorites().map(post => post.id)).toEqual(["2"]);
  });

  test("announces nothing while the gate it wraps is closed", async() => {
    const { observable, heard } = setup(() => false);

    expect(await observable.add("2")).toBe("blocked");
    expect(await observable.remove("1")).toBe("blocked");
    expect(heard).toEqual({ added: [], removed: [] });
  });

  test("announces a favorite that was already added", async() => {
    const observable = new ObservableRemoteFavoriteActions(createAnsweringActions("alreadyAdded", "removed"));
    const heard = listen(observable);

    expect(await observable.add("1")).toBe("alreadyAdded");
    expect(heard.added).toEqual(["1"]);
  });

  test.each<AddFavoriteResult>(["loggedOut", "cancelled", "error"])("announces nothing when adding answers %s", async result => {
    const observable = new ObservableRemoteFavoriteActions(createAnsweringActions(result, "removed"));
    const heard = listen(observable);

    expect(await observable.add("1")).toBe(result);
    expect(heard.added).toEqual([]);
  });

  test.each<RemoveFavoriteResult>(["cancelled", "error"])("announces nothing when removing answers %s", async result => {
    const observable = new ObservableRemoteFavoriteActions(createAnsweringActions("added", result));
    const heard = listen(observable);

    expect(await observable.remove("1")).toBe(result);
    expect(heard.removed).toEqual([]);
  });
});
