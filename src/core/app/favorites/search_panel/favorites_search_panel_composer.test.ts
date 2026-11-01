import { Mock, describe, expect, test, vi } from "vitest";
import { APP_STORAGE_SCHEMA } from "@/core/app/app_storage_schema";
import { Emitter } from "@/core/utils/reactive/emitter";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesBlacklist } from "@/core/features/favorites/search/favorites_blacklist";
import { FavoritesCollection } from "@/core/features/favorites/collection/favorites_collection";
import { FavoritesLoadState } from "@/core/features/favorites/load/favorites_load_state";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/favorites_search_index";
import { FavoritesSession } from "@/core/features/favorites/session/favorites_session";
import { MemoryClient } from "@/adapters/memory/client/memory_client";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/memory_local_keyed_values";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/memory_random_source";
import { MemoryRemotePages } from "@/adapters/memory/ports/remote_pages/memory_remote_pages";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { MemorySizeObserver } from "@/adapters/memory/ports/size_observer/memory_size_observer";
import { Milestone } from "@/core/utils/reactive/milestone";
import { Post } from "@/core/domain/post/post";
import { PostGridClass } from "@/core/ui/post_grid/post_grid";
import { Signal } from "@/core/utils/reactive/signal";
import { SkeletonGridClass } from "@/core/ui/post_grid/skeleton_grid";
import { StringInterner } from "@/core/utils/string/string_interner";
import { TileClass } from "@/core/ui/post_grid/tile";
import { VisibilityObserver } from "@/core/boundary/ports/visibility_observer/visibility_observer";
import { buildFavoritesSearchSettings } from "@/core/features/favorites/testing/favorites_search_settings_builder";
import { composeFavoritesSearchPanel } from "@/core/app/favorites/search_panel/favorites_search_panel_composer";
import { createFavoritesTab } from "@/core/app/favorites/workspace/favorites_tab";
import { createImageLoaderService } from "@/testing/image_loader_service";
import { createPost } from "@/testing/post";
import { createStoredTree } from "@/core/utils/storage/stored_tree";
import { render } from "@/core/ui/h/h";

interface Setup {
  element: HTMLElement;
  dispose: () => void;
  favoritesSession: FavoritesSession;
  watched: Set<Element>;
  open: Mock<(sequence: unknown, favorite: Favorite) => boolean>;
  enterZen: Mock<() => void>;
}

function setup(posts: Post[] = []): Setup {
  const favoritesSearchIndex = new FavoritesSearchIndex(new StringInterner());
  const favoritesPreferences = createStoredTree(APP_STORAGE_SCHEMA.preferences, new MemoryLocalKeyedValues(), ["favorites"]).favorites;
  const watched = new Set<Element>();
  const visibilityObserver: VisibilityObserver = {
    observe: element => {
      watched.add(element);
      return (): void => {
        watched.delete(element);
      };
    }
  };
  const open = vi.fn<(sequence: unknown, favorite: Favorite) => boolean>(() => true);
  const enterZen = vi.fn<() => void>();

  favoritesPreferences.pagination.pageSize.set(2);
  favoritesSearchIndex.rebuild(new FavoritesCollection(new StringInterner()).append(posts));
  const favoritesSession = new FavoritesSession({ favoritesSearchSettings: buildFavoritesSearchSettings() }, {
    favoritesSearchIndex,
    favoritesBlacklist: new FavoritesBlacklist({ blacklistedTags: [], force: false }),
    randomSource: new MemoryRandomSource(),
    favoritesPaginationPreferences: favoritesPreferences.pagination
  });

  favoritesSession.start();
  const scheduler = new MemoryScheduler();
  const { result: element, dispose } = render(document, () => composeFavoritesSearchPanel(createFavoritesTab(favoritesSession), {
    favoritesService: { loadState: new Signal<FavoritesLoadState>({ phase: "starting" }), searchable: new Milestone(), hydrated: new Emitter<Favorite>() },
    favoritesPreferences,
    tabCount: new Signal(1),
    favoriteSizeRecorder: { sizes: [] },
    visibilityObserver,
    sizeObserver: new MemorySizeObserver(),
    imageLoaderService: createImageLoaderService({ scheduler }),
    remotePages: new MemoryRemotePages(new MemoryClient([])),
    lightbox: { open },
    postActions: { openOriginal: vi.fn() },
    enterZen
  }));
  return { element, dispose, favoritesSession, watched, open, enterZen };
}

function queryTileLinks(element: HTMLElement): HTMLAnchorElement[] {
  return [...element.querySelectorAll<HTMLAnchorElement>(`.${PostGridClass.root}:not(.${SkeletonGridClass.root}) .${TileClass.link}`)];
}

function readShownPostUrls(element: HTMLElement): string[] {
  return queryTileLinks(element).map(link => {
    link.dispatchEvent(new Event("pointerdown"));
    return link.getAttribute("href")!;
  });
}

describe("composeFavoritesSearchPanel", () => {
  test("links each favorite's tile to its post's page", () => {
    const { element } = setup([createPost({ id: "1" })]);

    expect(readShownPostUrls(element)).toEqual(["#post-1"]);
  });

  test("shows only the tab's current page in the grid", () => {
    const { element, favoritesSession } = setup([createPost({ id: "1" }), createPost({ id: "2" }), createPost({ id: "3" })]);
    const firstPage = readShownPostUrls(element);

    favoritesSession.goTo(2);
    expect([firstPage, readShownPostUrls(element)]).toEqual([["#post-1", "#post-2"], ["#post-3"]]);
  });

  test("opens the clicked favorite in the lightbox", () => {
    const { element, open } = setup([createPost({ id: "1" })]);

    queryTileLinks(element)[0].click();
    expect(open.mock.calls.map(([, favorite]) => favorite.id)).toEqual(["1"]);
  });

  test("enters zen from the zen button", () => {
    const { element, enterZen } = setup();

    element.querySelector<HTMLButtonElement>("button[aria-label=Zen]")!.click();
    expect(enterZen).toHaveBeenCalledOnce();
  });

  test("stops watching its tiles once disposed", () => {
    const { element, dispose, watched } = setup([createPost({ id: "1" })]);
    const tiles = [...element.querySelectorAll(`.${PostGridClass.root}:not(.${SkeletonGridClass.root}) .${TileClass.root}`)];
    const countWatched = (): number => tiles.filter(tile => watched.has(tile)).length;
    const before = countWatched();

    dispose();
    expect([before, countWatched()]).toEqual([1, 0]);
  });
});
