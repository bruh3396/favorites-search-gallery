import { describe, expect, test } from "vitest";
import { GatedRemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/gated_remote_favorite_actions";
import { MemoryClient } from "@/adapters/memory/client/client";
import { MemoryRemoteFavoriteActions } from "@/adapters/memory/ports/remote_favorite_actions/remote_favorite_actions";
import { createPost } from "@/testing/post";

function setup(isOpen: () => boolean): { remote: MemoryClient; gated: GatedRemoteFavoriteActions } {
  const remote = new MemoryClient([createPost({ id: "1" }), createPost({ id: "2" })]);

  remote.removeFavorite("2");
  const gated = new GatedRemoteFavoriteActions({ remoteFavoriteActions: new MemoryRemoteFavoriteActions(remote), isOpen });
  return { remote, gated };
}

function readFavoriteIds(remote: MemoryClient): string[] {
  return remote.readFavorites().map(post => post.id);
}

describe("GatedRemoteFavoriteActions", () => {
  test("blocks adding and removing favorites while closed", async() => {
    const { remote, gated } = setup(() => false);

    expect(await gated.add("2")).toBe("blocked");
    expect(await gated.remove("1")).toBe("blocked");
    expect(readFavoriteIds(remote)).toEqual(["1"]);
  });

  test("adds and removes favorites while open", async() => {
    const { remote, gated } = setup(() => true);

    expect(await gated.add("2")).toBe("added");
    expect(await gated.remove("1")).toBe("removed");
    expect(readFavoriteIds(remote)).toEqual(["2"]);
  });

  test("checks whether it is open on every call", async() => {
    let isOpen = false;
    const { gated } = setup(() => isOpen);

    expect(await gated.remove("1")).toBe("blocked");
    isOpen = true;
    expect(await gated.remove("1")).toBe("removed");
  });
});
