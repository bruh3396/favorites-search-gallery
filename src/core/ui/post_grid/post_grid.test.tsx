import { Size } from "@/core/utils/geometry/size";
import { MediaItem } from "@/core/domain/media/media_item";
import { Mock, describe, expect, onTestFinished, test, vi } from "vitest";
import { Signal, computed } from "@/core/utils/reactive/signal";
import { h, render } from "@/core/ui/h/h";
import { Emitter } from "@/core/utils/reactive/emitter";
import { GridLayout } from "@/core/ui/post_grid/grid_layout";
import { ImageLoaderService } from "@/core/ui/post_grid/image_loader_service";
import { MemorySizeObserver } from "@/adapters/memory/ports/size_observer/memory_size_observer";
import { PostGrid } from "@/core/ui/post_grid/post_grid";
import { TileClass } from "@/core/ui/post_grid/tile";
import { TileLocator } from "@/core/ui/post_grid/tile_locator";
import { createImageLoaderService } from "@/testing/image_loader_service";

interface Setup {
  element: HTMLElement;
  dispose: () => void;
  posts: Signal<readonly MediaItem[]>;
  changed: Emitter<MediaItem>;
  tileLocator: TileLocator<MediaItem>;
  layout: Signal<GridLayout>;
  columnCount: Signal<number>;
  sizeObserver: MemorySizeObserver;
  onPlainClick: Mock<(post: MediaItem) => boolean>;
}

function createPost(id: string): MediaItem {
  return { id, media: { kind: "image", locator: `images/${id}` } };
}

function setup(...ids: string[]): Setup {
  const posts = new Signal<readonly MediaItem[]>(ids.map(createPost));
  const changed = new Emitter<MediaItem>();
  const tileLocator = new TileLocator<MediaItem>();
  const layout = new Signal<GridLayout>("grid");
  const columnCount = new Signal(2);
  const sizeObserver = new MemorySizeObserver();
  const onPlainClick = vi.fn<(post: MediaItem) => boolean>(() => true);
  const { result: element, dispose } = render(document, () => (
    <PostGrid
      posts={posts}
      changed={changed}
      tileLocator={tileLocator}
      settings={{ layout, columnCount }}
      visibilityObserver={{ observe: () => (): void => { } }}
      sizeObserver={sizeObserver}
      imageLoaderService={createImageLoaderService()}
      getSize={getSize}
      createActions={createActions}
      getPostUrl={post => `https://posts/${post.id}`}
      onPlainClick={onPlainClick}
    />
  ));
  return { element, dispose, posts, changed, tileLocator, layout, columnCount, sizeObserver, onPlainClick };
}

function getSize(post: MediaItem): Size {
  return { width: Number(post.id) * 100, height: 100 };
}

function createActions(post: MediaItem): Node[] {
  const action = document.createElement("button");

  action.dataset.postId = post.id;
  return [action];
}

describe("PostGrid", () => {
  test("draws a tile for each post", () => {
    const { element } = setup("1", "2", "3");

    expect(element.dataset.layout).toBe("grid");
    expect(element.children).toHaveLength(3);
  });

  test("shapes each tile after its post's size", () => {
    const { element } = setup("1", "2");

    expect([...element.children].map(tile => (tile as HTMLElement).style.getPropertyValue("--fsg-Tile-aspect-ratio"))).toEqual(["100 / 100", "200 / 100"]);
  });

  test("gives each tile the actions made for its post", () => {
    const { element } = setup("1", "2");

    expect([...element.children].map(tile => tile.querySelector("button")?.dataset.postId)).toEqual(["1", "2"]);
  });

  test("links each tile to its post's page", () => {
    const { element } = setup("1", "2");

    const links = [...element.querySelectorAll<HTMLAnchorElement>(`.${TileClass.link}`)];

    links.forEach(link => link.dispatchEvent(new Event("pointerdown")));
    expect(links.map(link => link.href)).toEqual(["https://posts/1", "https://posts/2"]);
  });

  test("reports the post whose tile is clicked", () => {
    const { element, posts, onPlainClick } = setup("1", "2");

    element.querySelectorAll<HTMLElement>(`.${TileClass.link}`)[1].click();
    expect(onPlainClick).toHaveBeenCalledExactlyOnceWith(posts.value[1]);
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

  test("sizes its tiles' HD images to its measured device pixel width and its settings", () => {
    const createLoader = vi.spyOn(ImageLoaderService.prototype, "createLoader");

    onTestFinished(() => {
      vi.restoreAllMocks();
    });
    const { element, sizeObserver, columnCount } = setup("40");
    const targetWidth = createLoader.mock.calls[0][2];

    expect(targetWidth.value).toBe(0);
    sizeObserver.resize(element, { width: 500, height: 800, devicePixelWidth: 1_000 });
    expect(targetWidth.value).toBe(500);
    columnCount.value = 1;
    expect(targetWidth.value).toBe(1_000);
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

  test("stops what a tile's actions follow once the tile is gone", () => {
    const label = new Signal("a");
    const posts = new Signal<readonly MediaItem[]>([createPost("1")]);
    const seen: string[] = [];

    render(document, () => (
      <PostGrid
        posts={posts}
        changed={new Emitter<MediaItem>()}
        settings={{ layout: new Signal<GridLayout>("grid"), columnCount: new Signal(2) }}
        visibilityObserver={{ observe: () => ():void => { } }}
        sizeObserver={new MemorySizeObserver()}
        imageLoaderService={createImageLoaderService()}
        getSize={getSize}
        createActions={() => [
          <button>
            {computed(() => {
              seen.push(label.value);
              return label.value;
            })}
          </button>
        ]}
        onPlainClick={() => true}
      />
    ));
    posts.value = [];
    label.value = "b";
    expect(seen).toEqual(["a"]);
  });
});
