import { describe, expect, test } from "vitest";
import { Favorite } from "@/types/favorite";
import { FeatureBridge } from "@/app/context/feature_bridge";
import { createEnvironment } from "@/testing/environment";
import { createPost } from "@/testing/post";

function createFavorite(id: string): Favorite {
  return { id, media: { kind: "gif", locator: `favorite/${id}` } } as Partial<Favorite> as Favorite;
}

function setup(mode: "favorites" | "postList"): FeatureBridge {
  const bridge = new FeatureBridge(createEnvironment({ mode }));
  const favorite = createFavorite("1");
  const post = createPost({ id: "1", media: { kind: "video", locator: "post/1" } });

  bridge.favorites.favorite.serve(id => (id === favorite.id ? favorite : undefined));
  bridge.postList.post.serve(id => (id === post.id ? post : undefined));
  return bridge;
}

describe("FeatureBridge", () => {
  describe("postMedia", () => {
    test("reads a favorite on the favorites page", () => {
      expect(setup("favorites").postMedia("1")?.media).toEqual({ kind: "gif", locator: "favorite/1" });
    });

    test("reads a post list's post in posts mode", () => {
      expect(setup("postList").postMedia("1")?.media).toEqual({ kind: "video", locator: "post/1" });
    });

    test("finds nothing for an unknown id", () => {
      expect(setup("favorites").postMedia("2")).toBeUndefined();
      expect(setup("postList").postMedia("2")).toBeUndefined();
    });
  });
});
