import { Dimensions, MediaItem } from "@/core/domain/post/post";
import { Emitter } from "@/core/utils/reactive/emitter";
import { Readable, computed } from "@/core/utils/reactive/signal";
import { SearchBox, SearchBoxClass } from "@/core/ui/components/search_box/search_box";
import { EmptyState } from "@/core/ui/components/empty_state/empty_state";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesService } from "@/core/features/favorites/favorites";
import { FavoritesSession } from "@/core/features/favorites/session/session";
import { ImageLoaderService } from "@/core/ui/post_grid/image_loader_service";
import { Paginator } from "@/core/ui/components/paginator/paginator";
import { PostGrid } from "@/core/ui/post_grid/post_grid";
import { PostGridPreferences } from "@/core/app/preferences";
import { Preference } from "@/core/utils/reactive/preference";
import { SkeletonGrid } from "@/core/ui/post_grid/skeleton";
import { TileLocator } from "@/core/ui/post_grid/tile_locator";
import { VisibilityObserver } from "@/core/boundary/ports/visibility_observer/visibility_observer";
import { createIcon } from "@/core/ui/components/icon/icon";
import { h } from "@/core/ui/h/h";

export const FavoritesSearchPanelClass = {
  root: "fsg-FavoritesSearchPanel",
  header: "fsg-FavoritesSearchPanel-header",
  search: "fsg-FavoritesSearchPanel-search",
  filter: "fsg-FavoritesSearchPanel-filter",
  count: "fsg-FavoritesSearchPanel-count",
  tabStripToggle: "fsg-FavoritesSearchPanel-tabStripToggle",
  tabCount: "fsg-FavoritesSearchPanel-tabCount",
  body: "fsg-FavoritesSearchPanel-body"
} as const;

export interface FavoritesSearchPanelProps {
  favorites: Pick<FavoritesService, "hydrated" | "loaded">;
  session: Pick<FavoritesSession, "query" | "isFiltered" | "results" | "pageItems" | "pageNumber" | "pageCount" | "goTo" | "clearFilters" | "submit">;
  focusSearch: Emitter<void>;
  tileLocator: TileLocator<Favorite>;
  skeletonDimensions: readonly Dimensions[];
  skeletonItemCount: number;
  gridPreferences: PostGridPreferences;
  tabStripVisible: Preference<boolean>;
  tabCount: Readable<number>;
  visibilityObserver: VisibilityObserver;
  imageLoaderService: Pick<ImageLoaderService, "resolvePreviewUrl" | "createLoader">;
  getPostUrl: (post: MediaItem) => string;
  onPlainClick: (post: Favorite) => void;
  onCtrlClick: (post: Favorite) => void;
}

export function FavoritesSearchPanel(props: FavoritesSearchPanelProps): HTMLElement {
  const { favorites, session, focusSearch, tileLocator,
    skeletonDimensions, gridPreferences: { layout, tilesPerRow }, tabStripVisible, tabCount, skeletonItemCount,
    visibilityObserver, imageLoaderService, getPostUrl, onPlainClick, onCtrlClick } = props;
  const hiddenTabCount = computed(() => (tabStripVisible.value ? 0 : tabCount.value));
  const body: HTMLElement = (
    <div className={FavoritesSearchPanelClass.body}>
      <SkeletonGrid
        isShown={computed(() => !favorites.loaded.reached && session.results.value.length === 0)}
        dimensions={skeletonDimensions}
        layout={layout}
        tilesPerRow={tilesPerRow}
        count={skeletonItemCount}
      />
      <EmptyState
        isShown={computed(() => favorites.loaded.reached && session.results.value.length === 0)}
        message={computed(() => {
          const query = session.query.value;

          if (query !== "") {
            return `No favorites match "${query}"`;
          }

          if (session.isFiltered.value) {
            return "No favorites match these filters";
          }
          return "No favorites yet";
        })}
        action={computed(() => (session.isFiltered.value ? {
          label: "Clear",
          onClick: (): void => {
            session.clearFilters();
            focusSearch.emit();
          }
        } : null))}
      />
      <PostGrid
        posts={session.pageItems}
        changed={favorites.hydrated}
        tileLocator={tileLocator}
        settings={props.gridPreferences}
        getDimensions={post => ({ width: post.getMetric("width"), height: post.getMetric("height") })}
        createActions={() => []}
        visibilityObserver={visibilityObserver}
        imageLoaderService={imageLoaderService}
        getPostUrl={getPostUrl}
        onPlainClick={onPlainClick}
        onCtrlClick={onCtrlClick}
      />
    </div>
  );
  return (
    <section className={FavoritesSearchPanelClass.root}>
      <header className={FavoritesSearchPanelClass.header}>
        <div className={FavoritesSearchPanelClass.search}>
          <SearchBox
            label="Search favorites"
            query={session.query}
            trailing={[
              <button className={FavoritesSearchPanelClass.filter} type="button" aria-label="Filters" aria-disabled="true">
                {createIcon("filter", SearchBoxClass.icon)}
              </button>,
              <span className={FavoritesSearchPanelClass.count}>
                {computed(() => describeResultCount(session.results.value.length))}
              </span>
            ]}
            focusRequests={focusSearch}
            onSearch={query => {
              session.submit(query);
              body.scrollTop = 0;
            }}
          />
        </div>
        <Paginator
          pageNumber={session.pageNumber}
          pageCount={session.pageCount}
          onPageChange={pageNumber => {
            session.goTo(pageNumber);
            body.scrollTop = 0;
          }}
        />
        <button
          className={FavoritesSearchPanelClass.tabStripToggle}
          type="button"
          aria-label={computed(() => (hiddenTabCount.value > 1 ? `Show tabs (${hiddenTabCount.value} open)` : "Show tabs"))}
          aria-pressed={computed(() => String(tabStripVisible.value))}
          onClick={() => tabStripVisible.set(!tabStripVisible.peek())}
        >
          {createIcon("appWindow", SearchBoxClass.icon)}
          <span className={FavoritesSearchPanelClass.tabCount} hidden={computed(() => hiddenTabCount.value < 2)}>
            {computed(() => String(hiddenTabCount.value))}
          </span>
        </button>
      </header>
      {body}
    </section>
  );
}

function describeResultCount(count: number): string {
  return count === 1 ? "1 result" : `${count.toLocaleString()} results`;
}
