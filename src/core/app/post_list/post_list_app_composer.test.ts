import { describe, expect, test } from "vitest";
import { AppRootClass } from "@/core/ui/app_root/app_root";
import { MemoryFileSaver } from "@/adapters/memory/ports/file_saver/file_saver";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { MemoryNavigator } from "@/adapters/memory/ports/navigator/navigator";
import { MemoryRemoteMedia } from "@/adapters/memory/ports/remote_media/remote_media";
import { MemoryRemotePages } from "@/adapters/memory/ports/remote_pages/remote_pages";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { MemorySizeObserver } from "@/adapters/memory/ports/size_observer/size_observer";
import { Post } from "@/core/domain/post/post";
import { PostGridClass } from "@/core/ui/post_grid/post_grid";
import { RemoteSearchResults } from "@/core/boundary/ports/remote_search_results/remote_search_results";
import { SkeletonGridClass } from "@/core/ui/post_grid/skeleton_grid";
import { TileClass } from "@/core/ui/post_grid/tile";
import { composePostListApp } from "@/core/app/post_list/post_list_app_composer";
import { createPost } from "@/testing/post";

function mount(localKeyedValues = new MemoryLocalKeyedValues(), posts: Post[] = []): ShadowRoot {
  const container = document.createElement("div");
  const remoteSearchResults: RemoteSearchResults = {
    readInitialPage: () => ({ index: 0, posts }),
    fetchPage: async index => ({ index, posts: [] })
  };

  composePostListApp({ colorScheme: "light" }, {
    scheduler: new MemoryScheduler(),
    visibilityObserver: { observe: (): (() => void) => () => { } },
    sizeObserver: new MemorySizeObserver(),
    remoteMedia: new MemoryRemoteMedia(),
    remotePages: new MemoryRemotePages(),
    remoteSearchResults,
    localKeyedValues,
    navigator: new MemoryNavigator(),
    fileSaver: new MemoryFileSaver()
  }).mount(container);
  return container.shadowRoot!;
}

describe("composePostListApp", () => {
  test("mounts the post grid without a skeleton in the app root inside the container", () => {
    const app = mount().querySelector<HTMLElement>(`.${AppRootClass.root}`)!;

    expect(app.querySelector(`.${SkeletonGridClass.root}`)).toBeNull();
    expect(app.querySelector(`.${PostGridClass.root}`)).not.toBeNull();
  });

  test("lays the grid out in the layout kept in the post list preferences, not the favorites'", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();

    localKeyedValues.set("favorites-search-gallery", { preferences: { postList: { grid: { layout: "row" } }, favorites: { grid: { layout: "square" } } } });
    expect(mount(localKeyedValues).querySelector<HTMLElement>(`.${PostGridClass.root}`)!.dataset.layout).toBe("row");
  });

  test("leaves a tile's click to its post link while the lightbox is off", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });

    localKeyedValues.set("favorites-search-gallery", { preferences: { postList: { lightbox: { mode: "off" } } } });
    const root = mount(localKeyedValues, [createPost({ id: "1" })]);

    root.querySelector(`.${TileClass.link}`)!.dispatchEvent(click);
    expect([click.defaultPrevented, root.querySelector("dialog")!.open]).toEqual([false, false]);
  });
});
