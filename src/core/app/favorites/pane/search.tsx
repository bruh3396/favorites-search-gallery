import { Dimensions, MediaItem } from "@/core/domain/post/post";
import { Readable, Signal, computed } from "@/core/utils/reactive/signal";
import { SearchSettings, isFiltered } from "@/core/features/favorites/search/inputs";
import { EmptyState } from "@/core/ui/components/empty_state/empty_state";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesSearchSession } from "@/core/features/favorites/search/session";
import { FavoritesService } from "@/core/features/favorites/favorites";
import { Media } from "@/core/domain/media/media";
import { Occurrence } from "@/core/utils/reactive/emitter";
import { Paginator } from "@/core/ui/components/paginator/paginator";
import { PostGrid } from "@/core/ui/post_grid/post_grid";
import { PostGridPreferences } from "@/core/app/preferences";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { SearchBox } from "@/core/ui/components/search_box/search_box";
import { SkeletonGrid } from "@/core/ui/post_grid/skeleton";
import { TileLocator } from "@/core/ui/post_grid/tile_locator";
import { VisibilityObserver } from "@/core/boundary/ports/visibility_observer/visibility_observer";
import { h } from "@/core/ui/h/h";

export const FavoritesSearchClass = {
  root: "fsg-FavoritesSearch",
  header: "fsg-FavoritesSearch-header",
  search: "fsg-FavoritesSearch-search",
  count: "fsg-FavoritesSearch-count",
  body: "fsg-FavoritesSearch-body",
  footer: "fsg-FavoritesSearch-footer"
} as const;

export interface FavoritesSearchProps {
  favorites: Pick<FavoritesService, "hydrated" | "loaded">;
  session: Pick<FavoritesSearchSession, "settings" | "results" | "paginationResult" | "goToPage" | "clearFilters">;
  scrollTo: Occurrence<Favorite>;
  tileLocator: TileLocator<Favorite>;
  skeletonDimensions: readonly Dimensions[];
  skeletonItemCount: number;
  gridPreferences: PostGridPreferences;
  upscalePaused?: Readable<boolean>;
  visiblePosts: Signal<readonly Favorite[]>;
  visibilityObserver: VisibilityObserver;
  decodeStill: (media: Media, signal: AbortSignal, width: number) => Promise<ImageBitmap>;
  scheduler: Pick<Scheduler, "schedule">;
  resolvePreviewUrl: (media: Media) => Promise<string>;
  getPostUrl: (post: MediaItem) => string;
  onSearch: (query: string) => void;
  onPlainClick: (post: Favorite) => void;
  onCtrlClick: (post: Favorite) => void;
  onPointerEnter: (post: Favorite) => void;
}

export function FavoritesSearch(props: FavoritesSearchProps): HTMLElement {
  const { favorites, session, scrollTo, tileLocator,
    skeletonDimensions, gridPreferences: { layout, size }, visiblePosts, skeletonItemCount,
    visibilityObserver, decodeStill, scheduler, resolvePreviewUrl, getPostUrl, onSearch, onPlainClick, onCtrlClick, onPointerEnter } = props;
  return (
    <section className={FavoritesSearchClass.root}>
      <header className={FavoritesSearchClass.header}>
        <div className={FavoritesSearchClass.search}>
          <SearchBox
            label="Search favorites"
            query={computed(() => session.settings.value.query)}
            trailing={
              <span className={FavoritesSearchClass.count}>
                {computed(() => describeResultCount(session.paginationResult.value.totalResults))}
              </span>
            }
            onSearch={onSearch}
          />
        </div>
      </header>
      <div className={FavoritesSearchClass.body}>
        <SkeletonGrid
          isShown={computed(() => !favorites.loaded.reached && session.results.value.length === 0)}
          dimensions={skeletonDimensions}
          layout={layout}
          size={size}
          count={skeletonItemCount}
        />
        <EmptyState
          isShown={computed(() => favorites.loaded.reached && session.results.value.length === 0)}
          message={computed(() => describeNoResults(session.settings.value))}
          action={computed(() => (isFiltered(session.settings.value) ? { label: "Clear", onClick: () => session.clearFilters() } : null))}
        />
        <PostGrid
          posts={computed(() => session.paginationResult.value.favorites)}
          changed={favorites.hydrated}
          scrollTo={scrollTo}
          tileLocator={tileLocator}
          settings={props.gridPreferences}
          upscalePaused={props.upscalePaused}
          visiblePosts={visiblePosts}
          getDimensions={post => ({ width: post.getMetric("width"), height: post.getMetric("height") })}
          createActions={() => []}
          visibilityObserver={visibilityObserver}
          decodeStill={decodeStill}
          scheduler={scheduler}
          resolvePreviewUrl={resolvePreviewUrl}
          getPostUrl={getPostUrl}
          onPlainClick={onPlainClick}
          onCtrlClick={onCtrlClick}
          onPointerEnter={onPointerEnter}
        />
      </div>
      <footer className={FavoritesSearchClass.footer}>
        <Paginator
          pageNumber={computed(() => session.paginationResult.value.pageNumber)}
          pageCount={computed(() => session.paginationResult.value.totalPages)}
          onPageChange={pageNumber => session.goToPage(pageNumber)}
        />
      </footer>
    </section>
  );
}

function describeNoResults(settings: SearchSettings): string {
  if (settings.query !== "") {
    return `No favorites match "${settings.query}"`;
  }
  return isFiltered(settings) ? "No favorites match these filters" : "No favorites yet";
}

function describeResultCount(count: number): string {
  return count === 1 ? "1 result" : `${count.toLocaleString()} results`;
}
