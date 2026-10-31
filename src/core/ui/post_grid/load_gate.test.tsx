import { describe, expect, test } from "vitest";
import { LoadGate } from "@/core/ui/post_grid/load_gate";
import { MediaItem } from "@/core/domain/media/media_item";

function createPost(postId: string): MediaItem {
  return { id: postId, media: { kind: "image", locator: `images/${postId}` } };
}

describe("LoadGate", () => {
  test("opens after every current post has loaded", () => {
    const loadGate = new LoadGate();
    const firstLoaded = loadGate.onLoaded("1");
    const secondLoaded = loadGate.onLoaded("2");

    loadGate.setPosts([createPost("1"), createPost("2")]);
    expect(loadGate.isOpen.value).toBe(false);

    firstLoaded();
    expect(loadGate.isOpen.value).toBe(false);

    secondLoaded();
    expect(loadGate.isOpen.value).toBe(true);
  });

  test("stays closed when there are no posts", () => {
    const loadGate = new LoadGate();

    loadGate.setPosts([]);
    expect(loadGate.isOpen.value).toBe(false);
  });

  test("closes when a new unloaded post joins the current posts", () => {
    const loadGate = new LoadGate();
    const firstLoaded = loadGate.onLoaded("1");

    loadGate.setPosts([createPost("1")]);
    firstLoaded();
    expect(loadGate.isOpen.value).toBe(true);

    loadGate.setPosts([createPost("1"), createPost("2")]);
    expect(loadGate.isOpen.value).toBe(false);
  });

  test("ignores a completion from an outdated post instance", () => {
    const loadGate = new LoadGate();
    const staleLoaded = loadGate.onLoaded("1");
    const currentLoaded = loadGate.onLoaded("1");

    loadGate.setPosts([createPost("1")]);
    staleLoaded();
    expect(loadGate.isOpen.value).toBe(false);

    currentLoaded();
    expect(loadGate.isOpen.value).toBe(true);
  });

  test("forgets a loaded post once it leaves the grid", () => {
    const loadGate = new LoadGate();
    const loaded = loadGate.onLoaded("1");

    loadGate.setPosts([createPost("1")]);
    loaded();
    loadGate.setPosts([createPost("2")]);
    loadGate.setPosts([createPost("1")]);
    expect(loadGate.isOpen.value).toBe(false);
  });

  test("ignores completion from a post no longer in the grid", () => {
    const loadGate = new LoadGate();
    const loaded = loadGate.onLoaded("1");

    loadGate.setPosts([createPost("1")]);
    loadGate.setPosts([]);
    loaded();
    expect(loadGate.isOpen.value).toBe(false);
  });
});
