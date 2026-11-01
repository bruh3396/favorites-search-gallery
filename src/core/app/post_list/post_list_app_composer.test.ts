import { describe, expect, test } from "vitest";
import { AppRootClass } from "@/core/ui/app_root/app_root";
import { MemoryClient } from "@/adapters/memory/client/memory_client";
import { MemoryFileSaver } from "@/adapters/memory/ports/file_saver/memory_file_saver";
import { MemoryHostPage } from "@/adapters/memory/ports/host_page/memory_host_page";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/memory_local_keyed_values";
import { MemoryNavigator } from "@/adapters/memory/ports/navigator/memory_navigator";
import { MemoryRemoteMedia } from "@/adapters/memory/ports/remote_media/memory_remote_media";
import { MemoryRemotePages } from "@/adapters/memory/ports/remote_pages/memory_remote_pages";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { MemorySizeObserver } from "@/adapters/memory/ports/size_observer/memory_size_observer";
import { MemoryViewport } from "@/adapters/memory/ports/viewport/memory_viewport";
import { Post } from "@/core/domain/post/post";
import { PostGridClass } from "@/core/ui/post_grid/post_grid";
import { RemotePostList } from "@/core/boundary/ports/remote_post_list/remote_post_list";
import { SkeletonGridClass } from "@/core/ui/post_grid/skeleton_grid";
import { TileClass } from "@/core/ui/post_grid/tile";
import { composePostListApp } from "@/core/app/post_list/post_list_app_composer";
import { createPost } from "@/testing/post";

function mount(localKeyedValues = new MemoryLocalKeyedValues(), posts: Post[] = []): ShadowRoot {
  const container = document.createElement("div");
  const remotePostList: RemotePostList = {
    readInitialPage: () => ({ index: 0, posts }),
    fetchPage: index => Promise.resolve({ index, posts: [] })
  };

  composePostListApp({ colorScheme: "light" }, {
    scheduler: new MemoryScheduler(),
    visibilityObserver: { observe: (): (() => void) => () => { } },
    sizeObserver: new MemorySizeObserver(),
    viewport: new MemoryViewport(),
    remoteMedia: new MemoryRemoteMedia(),
    remotePages: new MemoryRemotePages(new MemoryClient(posts)),
    remotePostList,
    localKeyedValues,
    navigator: new MemoryNavigator(),
    fileSaver: new MemoryFileSaver(),
    hostPage: new MemoryHostPage()
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

    localKeyedValues.set("favorites-search-gallery:preferences", { postList: { grid: { layout: "row" } }, favorites: { grid: { layout: "square" } } });
    expect(mount(localKeyedValues).querySelector<HTMLElement>(`.${PostGridClass.root}`)!.dataset.layout).toBe("row");
  });

  test("leaves a tile's click to its post link while the lightbox is off", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });

    localKeyedValues.set("favorites-search-gallery:preferences", { postList: { lightbox: { mode: "off" } } });
    const root = mount(localKeyedValues, [createPost({ id: "1" })]);

    root.querySelector(`.${TileClass.link}`)!.dispatchEvent(click);
    expect([click.defaultPrevented, root.querySelector("dialog")!.open]).toEqual([false, false]);
  });
});
