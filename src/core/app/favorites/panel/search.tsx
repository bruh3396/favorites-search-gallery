import { Dimensions, MediaItem } from "@/core/domain/post/post";
import { Emitter, Occurrence } from "@/core/utils/reactive/emitter";
import { Readable, Signal, computed } from "@/core/utils/reactive/signal";
import { SearchBox, SearchBoxClass } from "@/core/ui/components/search_box/search_box";
import { EmptyState } from "@/core/ui/components/empty_state/empty_state";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesService } from "@/core/features/favorites/favorites";
import { FavoritesSession } from "@/core/features/favorites/session/session";
import { Media } from "@/core/domain/media/media";
import { Paginator } from "@/core/ui/components/paginator/paginator";
import { PostGrid } from "@/core/ui/post_grid/post_grid";
import { PostGridPreferences } from "@/core/app/preferences";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
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
  body: "fsg-FavoritesSearchPanel-body"
} as const;

export interface FavoritesSearchPanelProps {
  favorites: Pick<FavoritesService, "hydrated" | "loaded">;
  session: Pick<FavoritesSession, "query" | "isFiltered" | "results" | "pageItems" | "pageNumber" | "pageCount" | "goTo" | "clearFilters">;
  scrollTo: Occurrence<Favorite>;
  focusSearch: Emitter<void>;
  tileLocator: TileLocator<Favorite>;
  skeletonDimensions: readonly Dimensions[];
  skeletonItemCount: number;
  gridPreferences: PostGridPreferences;
  upscalePaused?: Readable<boolean>;
  visiblePosts: Signal<readonly Favorite[]>;
  visibilityObserver: VisibilityObserver;
  decodeStill: (media: Media, signal: AbortSignal, width: number) => Promise<ImageBitmap>;
  scheduler: Pick<Scheduler, "schedule">;
  resolvePreviewUrl: (media: Media) => string;
  getPostUrl: (post: MediaItem) => string;
  onSearch: (query: string) => void;
  onPlainClick: (post: Favorite) => void;
  onCtrlClick: (post: Favorite) => void;
  onPointerEnter: (post: Favorite) => void;
}

export function FavoritesSearchPanel(props: FavoritesSearchPanelProps): HTMLElement {
  const { favorites, session, scrollTo, focusSearch, tileLocator,
    skeletonDimensions, gridPreferences: { layout, size }, visiblePosts, skeletonItemCount,
    visibilityObserver, decodeStill, scheduler, resolvePreviewUrl, getPostUrl, onSearch, onPlainClick, onCtrlClick, onPointerEnter } = props;
  const body: HTMLElement = (
    <div className={FavoritesSearchPanelClass.body}>
      <SkeletonGrid
        isShown={computed(() => !favorites.loaded.reached && session.results.value.length === 0)}
        dimensions={skeletonDimensions}
        layout={layout}
        size={size}
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
              onSearch(query);
              body.scrollTop = 0;
            }}
          />
        </div>
        <Paginator
          pageNumber={session.pageNumber}
          pageCount={session.pageCount}
          scheduler={scheduler}
          onPageChange={pageNumber => {
            session.goTo(pageNumber);
            body.scrollTop = 0;
          }}
        />
      </header>
      {body}
    </section>
  );
}

function describeResultCount(count: number): string {
  return count === 1 ? "1 result" : `${count.toLocaleString()} results`;
}
