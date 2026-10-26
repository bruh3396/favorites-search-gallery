import { Mock, describe, expect, test, vi } from "vitest";
import { Emitter } from "@/core/utils/reactive/emitter";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesBlacklist } from "@/core/features/favorites/search/favorites_blacklist";
import { FavoritesCollection } from "@/core/features/favorites/collection/favorites_collection";
import { FavoritesLoadState } from "@/core/features/favorites/load/favorites_load_state";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/favorites_search_index";
import { FavoritesSession } from "@/core/features/favorites/session/favorites_session";
import { createImageLoaderService } from "@/testing/image_loader_service";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/random_source";
import { MemoryRemoteMedia } from "@/adapters/memory/ports/remote_media/remote_media";
import { MemoryRemotePages } from "@/adapters/memory/ports/remote_pages/remote_pages";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { MemorySizeObserver } from "@/adapters/memory/ports/size_observer/size_observer";
import { Milestone } from "@/core/utils/reactive/milestone";
import { Post } from "@/core/domain/post/post";
import { PostGridClass } from "@/core/ui/post_grid/post_grid";
import { Signal } from "@/core/utils/reactive/signal";
import { SkeletonGridClass } from "@/core/ui/post_grid/skeleton_grid";
import { TileClass } from "@/core/ui/post_grid/tile";
import { VisibilityObserver } from "@/core/boundary/ports/visibility_observer/visibility_observer";
import { composeSearchPanel } from "@/core/app/favorites/search_panel/composer";
import { createFavoritesPreferences } from "@/core/app/preferences";
import { createFavoritesTab } from "@/core/app/favorites/workspace/favorites_tab";
import { createPost } from "@/testing/post";
import { buildFavoritesSearchSettings } from "@/core/features/favorites/testing/favorites_search_settings_builder";
import { render } from "@/core/ui/h/h";
import { StringInterner } from "@/core/utils/string/string_interner";

interface Setup {
  element: HTMLElement;
  dispose: () => void;
  session: FavoritesSession;
  watched: Set<Element>;
  open: Mock<(sequence: unknown, favorite: Favorite) => boolean>;
  enterZen: Mock<() => void>;
}

function setup(posts: Post[] = []): Setup {
  const index = new FavoritesSearchIndex(new StringInterner());
  const preferences = createFavoritesPreferences(new MemoryLocalKeyedValues());
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

  preferences.pageSize.set(2);
  index.rebuild(new FavoritesCollection(new StringInterner()).append(posts));
  const session = new FavoritesSession({ settings: buildFavoritesSearchSettings() }, {
    searchIndex: index,
    blacklist: new FavoritesBlacklist({ blacklistedTags: [], force: false }),
    randomSource: new MemoryRandomSource(),
    paginationPreferences: preferences
  });

  session.start();
  const scheduler = new MemoryScheduler();
  const { result: element, dispose } = render(document, () => composeSearchPanel(createFavoritesTab(session), {
    favorites: { loadState: new Signal<FavoritesLoadState>({ phase: "starting" }), searchable: new Milestone(), hydrated: new Emitter<Favorite>() },
    preferences,
    tabCount: new Signal(1),
    skeletonDimensions: { value: [] },
    visibilityObserver,
    sizeObserver: new MemorySizeObserver(),
    imageLoaderService: createImageLoaderService({ scheduler }),
    remotePages: new MemoryRemotePages(),
    lightbox: { open },
    postActions: { openOriginal: vi.fn() },
    enterZen
  }));
  return { element, dispose, session, watched, open, enterZen };
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

describe("composeSearchPanel", () => {
  test("links each favorite's tile to its post's page", () => {
    const { element } = setup([createPost({ id: "1" })]);

    expect(readShownPostUrls(element)).toEqual(["#post-1"]);
  });

  test("shows only the tab's current page in the grid", () => {
    const { element, session } = setup([createPost({ id: "1" }), createPost({ id: "2" }), createPost({ id: "3" })]);
    const firstPage = readShownPostUrls(element);

    session.goTo(2);
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
