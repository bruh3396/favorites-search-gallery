import { PageDependencies, PageEnvironment } from "@/targets/userscript/pages/page";
import { Signal, computed } from "@/core/utils/reactive/signal";
import { FallbackRemotePosts } from "@/core/boundary/ports/remote_posts/fallback_remote_posts";
import { FavoritesPreferences } from "@/core/features/favorites/types/favorites";
import { FrozenCobaltClient } from "@/adapters/frozen_cobalt/client/client";
import { FrozenCobaltRemotePosts } from "@/adapters/frozen_cobalt/ports/remote_posts/remote_posts";
import { FrozenCobaltRemoteTagCategories } from "@/adapters/frozen_cobalt/ports/remote_tag_categories/remote_tag_categories";
import { IndexedDbClient } from "@/adapters/indexed_db/client/client";
import { IndexedDbLocalFavorites } from "@/adapters/indexed_db/ports/local_favorites/local_favorites";
import { IndexedDbLocalPosts } from "@/adapters/indexed_db/ports/local_posts/local_posts";
import { IndexedDbLocalTagCategories } from "@/adapters/indexed_db/ports/local_tag_categories/local_tag_categories";
import { ObservableRemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/observable_remote_favorite_actions";
import { Preference } from "@/core/utils/reactive/preference";
import { RATINGS } from "@/core/domain/post/post";
import { Rule34CdnRemoteMedia } from "@/adapters/rule34_cdn/ports/remote_media/remote_media";
import { Rule34RemoteFavoriteActions } from "@/adapters/rule34/ports/remote_favorite_actions/remote_favorite_actions";
import { Rule34RemoteFavorites } from "@/adapters/rule34/ports/remote_favorites/remote_favorites";
import { Rule34RemotePosts } from "@/adapters/rule34/ports/remote_posts/remote_posts";
import SCAFFOLD_CSS from "@/core/features/favorites/ui/scaffold/scaffold.css?inline";
import { Sort } from "@/core/features/favorites/types/search";
import UI_CSS from "@/core/ui/styles.css?inline";
import { createFavoritesScaffold } from "@/core/features/favorites/ui/scaffold/scaffold";
import { createPaginator } from "@/core/ui/components/paginator/paginator";
import { createPostGrid } from "@/core/ui/post_grid/post_grid";
import { createSearchBox } from "@/core/ui/components/search_box/search_box";
import { createStatusText } from "@/core/ui/components/status_text/status_text";
import { describeLoadState } from "@/core/features/favorites/ui/load_status/load_status";
import { startFavorites } from "@/core/features/favorites/favorites";

declare const USE_LOCAL_SERVER: boolean;

export function composeFavoritesPage(environment: PageEnvironment, dependencies: PageDependencies): void {
  const { fetch, scheduler, randomSource, mintMedia, rule34, rule34Document, rule34Cdn, hostPage } = dependencies;
  const frozenCobalt = new FrozenCobaltClient(
    {
      origin: USE_LOCAL_SERVER ? "http://localhost:8787" : "https://frozencobalt.stream",
      identity: { userId: rule34Document.readUserId(), version: environment.version, platform: environment.device }
    },
    { scheduler, fetch }
  );
  const indexedDb = new IndexedDbClient();
  const remoteMedia = new Rule34CdnRemoteMedia(rule34Cdn);
  const favorites = startFavorites(
    { userOwnsFavorites: environment.ownsFavorites, blacklistedTags: environment.blacklistedTags },
    {
      localFavorites: new IndexedDbLocalFavorites({ ownerId: environment.favoritesOwnerId }, indexedDb),
      localPosts: new IndexedDbLocalPosts(indexedDb),
      localTagCategories: new IndexedDbLocalTagCategories(indexedDb),
      remoteFavorites: new Rule34RemoteFavorites({ rule34, rule34Document, scheduler, randomSource }),
      remoteFavoriteActions: new ObservableRemoteFavoriteActions(new Rule34RemoteFavoriteActions({ fetch, scheduler, randomSource })),
      remotePosts: new FallbackRemotePosts({
        primary: new FrozenCobaltRemotePosts({ frozenCobalt, mintMedia, scheduler, randomSource }),
        fallback: new Rule34RemotePosts({ rule34, scheduler, randomSource })
      }),
      remoteTagCategories: new FrozenCobaltRemoteTagCategories(frozenCobalt),
      remoteMedia,
      preferences: createPreferences(),
      waitForPaint,
      scheduler,
      randomSource
    }
  );
  const grid = createPostGrid(document, {
    posts: favorites.posts,
    changed: favorites.hydrated,
    layout: new Signal("row"),
    columnCount: new Signal(6),
    rowHeightViewportPercent: new Signal(20),
    getDimensions: post => ({ width: post.getMetric("width"), height: post.getMetric("height") }),
    resolvePreviewUrl: media => remoteMedia.resolvePreviewUrl(media)
  });
  const scaffold = createFavoritesScaffold(document);
  const shadowRoot = hostPage.claimContent().attachShadow({ mode: "open" });
  const app = document.createElement("div");
  const searchBox = createSearchBox(document, {
    label: "Search favorites",
    query: favorites.query,
    onSearch: query => favorites.intents.search(query)
  });
  const status = createStatusText(document, { text: computed(() => describeLoadState(favorites.loadState.value)) });
  const paginator = createPaginator(document, {
    pageNumber: computed(() => favorites.page.value.pageNumber),
    pageCount: computed(() => favorites.page.value.pageCount),
    onPageChange: pageNumber => favorites.intents.showPage(pageNumber)
  });

  scaffold.search.append(searchBox.element);
  scaffold.status.append(status.element);
  scaffold.paginator.append(paginator.element);
  scaffold.content.append(grid.element);
  app.className = "fsg-App";
  app.style.colorScheme = environment.colorScheme;
  app.append(scaffold.element);
  shadowRoot.adoptedStyleSheets = [createStyleSheet(UI_CSS), createStyleSheet(SCAFFOLD_CSS)];
  shadowRoot.append(app);
}

function createPreferences(): FavoritesPreferences {
  return {
    sort: createMemoryPreference<Sort>({ key: "favorited", isAscending: false }),
    allowedRatings: createMemoryPreference<ReadonlySet<(typeof RATINGS)[number]>>(new Set(RATINGS)),
    isBlacklistEnabled: createMemoryPreference(true),
    resultsPerPage: createMemoryPreference(50),
    isInfiniteScrollEnabled: createMemoryPreference(false)
  };
}

function createMemoryPreference<T>(initial: T): Preference<T> {
  const signal = new Signal(initial);
  return {
    get value(): T {
      return signal.value;
    },
    peek: (): T => signal.peek(),
    set: (value: T): void => {
      signal.value = value;
    }
  };
}

function waitForPaint(): Promise<void> {
  return new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve)));
}

function createStyleSheet(css: string): CSSStyleSheet {
  const sheet = new CSSStyleSheet();

  sheet.replaceSync(css);
  return sheet;
}
