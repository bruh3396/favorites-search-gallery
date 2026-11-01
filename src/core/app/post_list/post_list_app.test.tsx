import { describe, expect, onTestFinished, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { Emitter } from "@/core/utils/reactive/emitter";
import { GridLayout } from "@/core/ui/post_grid/grid_layout";
import { KeyedStoredValue } from "@/core/utils/storage/keyed_stored_value";
import { MemoryRemoteMedia } from "@/adapters/memory/ports/remote_media/memory_remote_media";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { MemorySizeObserver } from "@/adapters/memory/ports/size_observer/memory_size_observer";
import { MemoryViewport } from "@/adapters/memory/ports/viewport/memory_viewport";
import { Post } from "@/core/domain/post/post";
import { PostGridClass } from "@/core/ui/post_grid/post_grid";
import { PostListApp } from "@/core/app/post_list/post_list_app";
import { Signal } from "@/core/utils/reactive/signal";
import { TileClass } from "@/core/ui/post_grid/tile";
import { createImageLoaderService } from "@/testing/image_loader_service";
import { createLightbox } from "@/core/features/lightbox/lightbox";
import { createPost } from "@/testing/post";

function mount(posts: Post[]): HTMLElement[] {
  const storedValueStorage = { get: (): undefined => undefined, set: (): void => undefined };
  const lightbox = createLightbox<Post>({
    scheduler: new MemoryScheduler(),
    sizeObserver: new MemorySizeObserver(),
    viewport: new MemoryViewport(),
    remoteMedia: new MemoryRemoteMedia(),
    actions: { openPostPage: vi.fn(), openOriginal: vi.fn(), download: vi.fn() },
    preferences: {
      mode: new Signal("full"),
      volume: new KeyedStoredValue({ key: "volume", defaultValue: 1 }, { storedValueStorage }),
      muted: new KeyedStoredValue({ key: "muted", defaultValue: false }, { storedValueStorage })
    },
    locateItem: () => undefined
  });
  const { result: elements, dispose } = render(document, () => h(PostListApp, {
    posts: new Signal<readonly Post[]>(posts),
    postGridProps: {
      changed: new Emitter<Post>(),
      settings: { layout: new Signal<GridLayout>("grid"), columnCount: new Signal(2) },
      visibilityObserver: { observe: () => (): void => { } },
      sizeObserver: new MemorySizeObserver(),
      imageLoaderService: createImageLoaderService(),
      getSize: () => ({ width: 100, height: 100 }),
      createActions: () => [],
      onPlainClick: () => true
    },
    lightbox
  }));

  onTestFinished(() => {
    dispose();
    lightbox.dispose();
  });
  return elements;
}

describe("PostListApp", () => {
  test("draws the post grid followed by the lightbox view", () => {
    const [grid, lightboxView, ...rest] = mount([]);

    expect([grid.classList.contains(PostGridClass.root), lightboxView.tagName, rest]).toEqual([true, "DIALOG", []]);
  });

  test("hands the posts to the grid", () => {
    const [grid] = mount([createPost({ id: "1" }), createPost({ id: "2" })]);

    expect(grid.querySelectorAll(`.${TileClass.root}`)).toHaveLength(2);
  });
});
