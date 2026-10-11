import { Dimensions, MediaItem } from "@/core/domain/post/post";
import { Mock, describe, expect, test, vi } from "vitest";
import { PostGrid, PostGridClass } from "@/core/ui/post_grid/post_grid";
import { Signal, computed } from "@/core/utils/reactive/signal";
import { h, render } from "@/core/ui/h/h";
import { Emitter } from "@/core/utils/reactive/emitter";
import { GridLayout } from "@/core/ui/post_grid/tiler";
import { Media } from "@/core/domain/media/media";
import { MemoryBitmapDecoder } from "@/adapters/memory/ports/bitmap_decoder/bitmap_decoder";
import { TileClass } from "@/core/ui/post_grid/tile";
import { doNothing } from "@/core/utils/function/function";

type VisibilityListener = (visible: boolean) => void;

interface Setup {
  element: HTMLElement;
  dispose: () => void;
  posts: Signal<readonly MediaItem[]>;
  changed: Emitter<MediaItem>;
  scrollTo: Emitter<MediaItem>;
  layout: Signal<GridLayout>;
  size: Signal<number>;
  visiblePosts: Signal<readonly MediaItem[]>;
  showTile: (index: number) => void;
  hideTile: (index: number) => void;
  onActivate: Mock<(post: MediaItem, event: MouseEvent) => void>;
  onPointerEnter: Mock<(post: MediaItem) => void>;
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
  const scrollTo = new Emitter<MediaItem>();
  const layout = new Signal<GridLayout>("grid");
  const size = new Signal(2);
  const visiblePosts = new Signal<readonly MediaItem[]>([]);
  const observers = new Map<Element, VisibilityListener>();
  const onActivate = vi.fn<(post: MediaItem, event: MouseEvent) => void>();
  const onPointerEnter = vi.fn<(post: MediaItem) => void>();
  const visibilityObserver = {
    observe: (element: Element, onVisibilityChange: VisibilityListener): (() => void) => {
      observers.set(element, onVisibilityChange);
      return (): void => {
        observers.delete(element);
      };
    }
  };
  const { result: element, dispose } = render(document, () => (
    <PostGrid
      posts={posts}
      changed={changed}
      scrollTo={scrollTo}
      settings={{ layout, size, upscale: new Signal(false) }}
      visiblePosts={visiblePosts}
      bitmapDecoder={new MemoryBitmapDecoder()}
      visibilityObserver={visibilityObserver}
      fetchImage={() => Promise.resolve(new Blob())}
      getDimensions={getDimensions}
      createActions={createActions}
      resolvePreviewUrl={resolvePreviewUrl}
      getPostUrl={post => `https://posts/${post.id}`}
      onActivate={onActivate}
      onPointerEnter={onPointerEnter}
    />
  ));
  const getListener = (index: number): VisibilityListener | undefined => observers.get(element.children[index]!);
  const showTile = (index: number): void => getListener(index)?.(true);
  const hideTile = (index: number): void => getListener(index)?.(false);
  return { element, dispose, posts, changed, scrollTo, layout, size, visiblePosts, showTile, hideTile, onActivate, onPointerEnter };
}

function getDimensions(post: MediaItem): Dimensions {
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

    expect(element.className).toBe(PostGridClass.root);
    expect(element.dataset.layout).toBe("grid");
    expect(element.children).toHaveLength(3);
  });

  test("publishes visible posts in grid order", () => {
    const { visiblePosts, showTile, hideTile } = setup("1", "2");

    showTile(1);
    expect(visiblePosts.value.map(post => post.id)).toEqual(["2"]);
    showTile(0);
    expect(visiblePosts.value.map(post => post.id)).toEqual(["1", "2"]);
    hideTile(1);
    expect(visiblePosts.value.map(post => post.id)).toEqual(["1"]);
  });

  test("publishes nothing new when a tile reports the visibility it already has", () => {
    const { visiblePosts, showTile } = setup("1");

    showTile(0);
    const published = visiblePosts.value;

    showTile(0);
    expect(visiblePosts.value).toBe(published);
  });

  test("removes a post from the published list when its tile is removed", () => {
    const { posts, visiblePosts, showTile } = setup("1", "2");

    showTile(0);
    posts.value = [createPost("2")];

    expect(visiblePosts.value).toEqual([]);
  });

  test("shapes each tile after its post's dimensions", () => {
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

  test("activates the post whose tile is clicked", () => {
    const { element, posts, onActivate } = setup("1", "2");

    element.querySelectorAll<HTMLElement>(`.${TileClass.link}`)[1].click();
    expect(onActivate).toHaveBeenCalledExactlyOnceWith(posts.value[1], expect.any(MouseEvent));
  });

  test("reports the post whose tile the pointer enters", () => {
    const { element, posts, onPointerEnter } = setup("1", "2");

    element.querySelectorAll<HTMLElement>(`.${TileClass.link}`)[1].dispatchEvent(new Event("pointerenter"));
    expect(onPointerEnter).toHaveBeenCalledExactlyOnceWith(posts.value[1]);
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

  test("scrolls to the shown tile matching a requested post", () => {
    const { element, posts, scrollTo } = setup("1", "2");

    posts.value = [createPost("2"), createPost("3")];
    const scrollIntoView = vi.fn();

    element.children[1].scrollIntoView = scrollIntoView;
    scrollTo.emit(createPost("3"));
    expect(scrollIntoView).toHaveBeenCalledOnce();
  });

  test("ignores scroll requests for posts it does not show", () => {
    const { scrollTo } = setup("1");

    expect(() => scrollTo.emit(createPost("2"))).not.toThrow();
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
        settings={{ layout: new Signal<GridLayout>("grid"), size: new Signal(2), upscale: new Signal(false) }}
        visiblePosts={new Signal<readonly MediaItem[]>([])}
        bitmapDecoder={new MemoryBitmapDecoder()}
        visibilityObserver={{ observe: () => ():void => { } }}
        fetchImage={() => Promise.resolve(new Blob())}
        getDimensions={getDimensions}
        createActions={() => [
          <button>
            {computed(() => {
              seen.push(label.value);
              return label.value;
            })}
          </button>
        ]}
        resolvePreviewUrl={resolvePreviewUrl}
        onActivate={doNothing}
      />
    ));
    posts.value = [];
    label.value = "b";
    expect(seen).toEqual(["a"]);
  });
});
