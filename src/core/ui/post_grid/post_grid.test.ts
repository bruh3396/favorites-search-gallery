import { PostGrid, PostGridClass, createPostGrid, createPostGridPreferences } from "@/core/ui/post_grid/post_grid";
import { describe, expect, test } from "vitest";
import { Dimensions } from "@/core/ui/post_grid/tile";
import { Emitter } from "@/core/utils/reactive/emitter";
import { Layout } from "@/core/ui/post_grid/tiler";
import { Media } from "@/core/domain/media/media";
import { MediaItem } from "@/core/domain/post/post";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { Signal } from "@/core/utils/reactive/signal";

interface Setup extends PostGrid {
  posts: Signal<readonly MediaItem[]>;
  changed: Emitter<MediaItem>;
  layout: Signal<Layout>;
  size: Signal<number>;
}

function createPost(id: string): MediaItem {
  return { id, media: { kind: "image", locator: `images/${id}` } };
}

function resolvePreviewUrl(media: Media): Promise<string> {
  return Promise.resolve(`https://preview/${media.locator}`);
}

function setup(...ids: string[]): Setup {
  const posts = new Signal<readonly MediaItem[]>(ids.map(createPost));
  const changed = new Emitter<MediaItem>();
  const layout = new Signal<Layout>("grid");
  const size = new Signal(2);
  const grid = createPostGrid(document, { posts, changed, layout, size, getDimensions, createActions, resolvePreviewUrl });
  return { ...grid, posts, changed, layout, size };
}

function getDimensions(post: MediaItem): Dimensions {
  return { width: Number(post.id) * 100, height: 100 };
}

function createActions(post: MediaItem): Node[] {
  const action = document.createElement("button");

  action.dataset.postId = post.id;
  return [action];
}

describe("createPostGrid", () => {
  test("draws a tile for each post", () => {
    const { element } = setup("1", "2", "3");

    expect(element.className).toBe(PostGridClass.root);
    expect(element.dataset.layout).toBe("grid");
    expect(element.children).toHaveLength(3);
  });

  test("shapes each tile after its post's dimensions", () => {
    const { element } = setup("1", "2");

    expect([...element.children].map(tile => (tile as HTMLElement).style.getPropertyValue("--fsg-Tile-aspect-ratio"))).toEqual(["100 / 100", "200 / 100"]);
  });

  test("gives each tile the actions made for its post", () => {
    const { element } = setup("1", "2");

    expect([...element.children].map(tile => tile.querySelector("button")?.dataset.postId)).toEqual(["1", "2"]);
  });

  test("redraws when the posts change, keeping the tiles of posts still shown", () => {
    const { element, posts } = setup("1", "2");
    const second = element.children[1];

    posts.value = [createPost("2"), createPost("3")];
    expect(element.children).toHaveLength(2);
    expect(element.children[0]).toBe(second);
  });

  test("retiles the same tiles when the layout changes", () => {
    const { element, layout } = setup("1", "2", "3");
    const tiles = [...element.children];

    layout.value = "column";
    expect(element.dataset.layout).toBe("column");
    expect([...element.children[0].children, ...element.children[1].children]).toEqual([tiles[0], tiles[2], tiles[1]]);
  });

  test("resizes the tiles without moving them", () => {
    const { element, size } = setup("1", "2");
    const tiles = [...element.children];

    size.value = 3.5;
    expect(element.style.getPropertyValue("--fsg-PostGrid-size")).toBe("3.5");
    expect([...element.children]).toEqual(tiles);
  });

  test("redraws the tile of a post that changed in place, keeping the others", () => {
    const { element, changed } = setup("1", "2");
    const [first, second] = [...element.children];

    changed.emit(createPost("1"));
    expect(element.children[0]).not.toBe(first);
    expect(element.children[1]).toBe(second);
  });

  test("stops redrawing once disposed", () => {
    const { element, posts, changed, layout, dispose } = setup("1");
    const [tile] = [...element.children];

    dispose();
    posts.value = [createPost("2"), createPost("3")];
    layout.value = "row";
    changed.emit(createPost("1"));
    expect([...element.children]).toEqual([tile]);
    expect(element.dataset.layout).toBe("grid");
  });
});

describe("createPostGridPreferences", () => {
  test("starts in columns of size 6 when nothing is stored", () => {
    const { layout, size } = createPostGridPreferences(new MemoryLocalKeyedValues());

    expect([layout.value, size.value]).toEqual(["column", 6]);
  });

  test("restores a stored layout and falls back to the default for one it doesn't recognise", () => {
    const store = new MemoryLocalKeyedValues();

    store.set("postGridLayout", "row");
    expect(createPostGridPreferences(store).layout.value).toBe("row");
    store.set("postGridLayout", "masonry");
    expect(createPostGridPreferences(store).layout.value).toBe("column");
  });
});
