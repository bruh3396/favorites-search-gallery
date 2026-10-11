import { describe, expect, test } from "vitest";
import { LoadGate } from "@/core/ui/post_grid/load_gate";
import { MediaItem } from "@/core/domain/media/media";

function createPost(id: string): MediaItem {
  return { id, media: { kind: "image", locator: `images/${id}` } };
}

describe("LoadGate", () => {
  test("opens after every current post has loaded", () => {
    const gate = new LoadGate();
    const firstLoaded = gate.onLoaded("1");
    const secondLoaded = gate.onLoaded("2");

    gate.setPosts([createPost("1"), createPost("2")]);
    expect(gate.isOpen.value).toBe(false);

    firstLoaded();
    expect(gate.isOpen.value).toBe(false);

    secondLoaded();
    expect(gate.isOpen.value).toBe(true);
  });

  test("stays closed when there are no posts", () => {
    const gate = new LoadGate();

    gate.setPosts([]);
    expect(gate.isOpen.value).toBe(false);
  });

  test("closes when a new unloaded post joins the current posts", () => {
    const gate = new LoadGate();
    const firstLoaded = gate.onLoaded("1");

    gate.setPosts([createPost("1")]);
    firstLoaded();
    expect(gate.isOpen.value).toBe(true);

    gate.setPosts([createPost("1"), createPost("2")]);
    expect(gate.isOpen.value).toBe(false);
  });

  test("ignores a completion from an outdated post instance", () => {
    const gate = new LoadGate();
    const staleLoaded = gate.onLoaded("1");
    const currentLoaded = gate.onLoaded("1");

    gate.setPosts([createPost("1")]);
    staleLoaded();
    expect(gate.isOpen.value).toBe(false);

    currentLoaded();
    expect(gate.isOpen.value).toBe(true);
  });

  test("ignores completion from a post no longer in the grid", () => {
    const gate = new LoadGate();
    const loaded = gate.onLoaded("1");

    gate.setPosts([createPost("1")]);
    gate.setPosts([]);
    loaded();
    expect(gate.isOpen.value).toBe(false);
  });
});
