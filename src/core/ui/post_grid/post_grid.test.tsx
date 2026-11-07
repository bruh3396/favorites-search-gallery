import { Mock, describe, expect, test, vi } from "vitest";
import { Readable, Signal, computed } from "@/core/utils/reactive/signal";
import { h, render } from "@/core/ui/h/h";
import { Emitter } from "@/core/utils/reactive/emitter";
import { GridLayout } from "@/core/ui/post_grid/layout/grid_layout";
import { GridSizing } from "@/core/ui/post_grid/layout/grid_sizing";
import { MediaItem } from "@/core/domain/media/media_item";
import { MemorySizeObserver } from "@/adapters/memory/ports/size_observer/memory_size_observer";
import { PostGrid } from "@/core/ui/post_grid/post_grid";
import { TileLocator } from "@/core/ui/post_grid/tile_locator";

interface Setup {
  element: HTMLElement;
  dispose: () => void;
  posts: Signal<readonly MediaItem[]>;
  changed: Emitter<MediaItem>;
  tileLocator: TileLocator<MediaItem>;
  layout: Signal<GridLayout>;
  columnCount: Signal<number>;
  sizeObserver: MemorySizeObserver;
  createTile: Mock<(mediaItem: MediaItem, sizing: Readable<GridSizing>) => HTMLElement>;
}

function createPost(postId: string): MediaItem {
  return { id: postId, media: { kind: "image", locator: `images/${postId}` } };
}

function setup(...postIds: string[]): Setup {
  const posts = new Signal<readonly MediaItem[]>(postIds.map(createPost));
  const changed = new Emitter<MediaItem>();
  const tileLocator = new TileLocator<MediaItem>();
  const layout = new Signal<GridLayout>("grid");
  const columnCount = new Signal(2);
  const sizeObserver = new MemorySizeObserver();
  const createTile = vi.fn<(mediaItem: MediaItem, sizing: Readable<GridSizing>) => HTMLElement>(mediaItem => <div dataset={{ postId: mediaItem.id }} />);
  const { result: element, dispose } = render(document, () => (
    <PostGrid
      posts={posts}
      changed={changed}
      tileLocator={tileLocator}
      settings={{ layout, columnCount }}
      sizeObserver={sizeObserver}
      createTile={createTile}
    />
  ));
  return { element, dispose, posts, changed, tileLocator, layout, columnCount, sizeObserver, createTile };
}

describe("PostGrid", () => {
  test("draws the tile made for each post", () => {
    const { element } = setup("1", "2", "3");

    expect(element.dataset.layout).toBe("grid");
    expect([...element.children].map(tile => (tile as HTMLElement).dataset.postId)).toEqual(["1", "2", "3"]);
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
    const { element, columnCount } = setup("1", "2");
    const tiles = [...element.children];

    columnCount.value = 3;
    expect(element.style.getPropertyValue("--fsg-GridTiler-columnCount")).toBe("3");
    expect([...element.children]).toEqual(tiles);
  });

  test("gives each tile a sizing that follows its measured device pixel width and its settings", () => {
    const { element, sizeObserver, columnCount, createTile } = setup("1");
    const sizing = createTile.mock.calls[0][1];

    expect(sizing.value).toEqual({ layout: "grid", columnCount: 2, gridWidth: 0 });
    sizeObserver.resize(element, { width: 500, height: 800, devicePixelWidth: 1_000 });
    expect(sizing.value).toEqual({ layout: "grid", columnCount: 2, gridWidth: 1_000 });
    columnCount.value = 1;
    expect(sizing.value).toEqual({ layout: "grid", columnCount: 1, gridWidth: 1_000 });
  });

  test("redraws the tile of a post that changed in place, keeping the others", () => {
    const { element, changed } = setup("1", "2");
    const [first, second] = [...element.children];

    changed.emit(createPost("1"));
    expect(element.children[0]).not.toBe(first);
    expect(element.children[1]).toBe(second);
  });

  test("lets its locator find the tile of each shown post", () => {
    const { element, posts, tileLocator } = setup("1", "2");

    posts.value = [createPost("2"), createPost("3")];
    expect([tileLocator.locate(createPost("3")), tileLocator.locate(createPost("1"))]).toEqual([element.children[1], undefined]);
  });

  test("detaches from its locator once disposed", () => {
    const { tileLocator, dispose } = setup("1");

    dispose();
    expect(tileLocator.locate(createPost("1"))).toBeUndefined();
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

  test("stops what a tile follows once the tile is gone", () => {
    const label = new Signal("a");
    const posts = new Signal<readonly MediaItem[]>([createPost("1")]);
    const seen: string[] = [];

    render(document, () => (
      <PostGrid
        posts={posts}
        changed={new Emitter<MediaItem>()}
        settings={{ layout: new Signal<GridLayout>("grid"), columnCount: new Signal(2) }}
        sizeObserver={new MemorySizeObserver()}
        createTile={() => (
          <button>
            {computed(() => {
              seen.push(label.value);
              return label.value;
            })}
          </button>
        )}
      />
    ));
    posts.value = [];
    label.value = "b";
    expect(seen).toEqual(["a"]);
  });
});
