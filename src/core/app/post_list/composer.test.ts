import { describe, expect, test } from "vitest";
import { AppRootClass } from "@/core/ui/app_root/app_root";
import { MemoryFileSaver } from "@/adapters/memory/ports/file_saver/file_saver";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { MemoryNavigator } from "@/adapters/memory/ports/navigator/navigator";
import { MemoryRemoteMedia } from "@/adapters/memory/ports/remote_media/remote_media";
import { MemoryRemotePages } from "@/adapters/memory/ports/remote_pages/remote_pages";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { MemorySizeObserver } from "@/adapters/memory/ports/size_observer/size_observer";
import { RemoteSearchResults } from "@/core/boundary/ports/remote_search_results/remote_search_results";
import { PostGridClass } from "@/core/ui/post_grid/post_grid";
import { SkeletonGridClass } from "@/core/ui/post_grid/skeleton";
import { composePostListApp } from "@/core/app/post_list/composer";

const REMOTE_SEARCH_RESULTS: RemoteSearchResults = {
  readInitialPage: () => ({ index: 0, posts: [] }),
  fetchPage: async(index) => ({ index, posts: [] })
};

function mount(localKeyedValues = new MemoryLocalKeyedValues()): ShadowRoot {
  const container = document.createElement("div");

  composePostListApp({ colorScheme: "light" }, {
    scheduler: new MemoryScheduler(),
    visibilityObserver: { observe: (): (() => void) => () => { } },
    sizeObserver: new MemorySizeObserver(),
    remoteMedia: new MemoryRemoteMedia(),
    remotePages: new MemoryRemotePages(),
    remoteSearchResults: REMOTE_SEARCH_RESULTS,
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

    localKeyedValues.set("favorites-search-gallery", { preferences: { postList: { layout: "row" }, favorites: { layout: "square" } } });
    expect(mount(localKeyedValues).querySelector<HTMLElement>(`.${PostGridClass.root}`)!.dataset.layout).toBe("row");
  });
});
