import { Dimensions, MediaItem } from "@/core/domain/post/post";
import { Signal, computed } from "@/core/utils/reactive/signal";
import { Fact } from "@/core/utils/reactive/milestone";
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

export const FavoritesPaneClass = {
  root: "fsg-FavoritesPane",
  header: "fsg-FavoritesPane-header",
  search: "fsg-FavoritesPane-search",
  pagination: "fsg-FavoritesPane-pagination",
  content: "fsg-FavoritesPane-content"
} as const;

export interface FavoritesPaneProps {
  favorites: Pick<FavoritesService, "hydrated">;
  session: Pick<FavoritesSearchSession, "settings" | "results" | "paginationResult" | "submit" | "goToPage">;
  scrollTo: Occurrence<Favorite>;
  tileLocator: TileLocator<Favorite>;
  finishedLoading: Fact;
  skeletonDimensions: readonly Dimensions[];
  skeletonItemCount: number;
  gridPreferences: PostGridPreferences;
  visiblePosts: Signal<readonly Favorite[]>;
  visibilityObserver: VisibilityObserver;
  decodeImage: (media: Media, signal: AbortSignal) => Promise<ImageBitmap>;
  scheduler: Pick<Scheduler, "schedule">;
  resolvePreviewUrl: (media: Media) => Promise<string>;
  getPostUrl: (post: MediaItem) => string;
  onPlainClick: (post: Favorite) => void;
  onCtrlClick: (post: Favorite) => void;
  onPointerEnter: (post: Favorite) => void;
}

export function FavoritesPane(props: FavoritesPaneProps): HTMLElement {
  const { favorites, session, scrollTo, tileLocator, finishedLoading,
    skeletonDimensions, gridPreferences: { layout, size }, visiblePosts, skeletonItemCount,
    visibilityObserver, decodeImage, scheduler, resolvePreviewUrl, getPostUrl, onPlainClick, onCtrlClick, onPointerEnter } = props;
  return (
    <section className={FavoritesPaneClass.root}>
      <header className={FavoritesPaneClass.header}>
        <div className={FavoritesPaneClass.search}>
          <SearchBox label="Search favorites" query={computed(() => session.settings.value.query)} onSearch={query => session.submit(query)} />
        </div>
        <div className={FavoritesPaneClass.pagination}>
          <Paginator
            pageNumber={computed(() => session.paginationResult.value.pageNumber)}
            pageCount={computed(() => session.paginationResult.value.totalPages)}
            onPageChange={pageNumber => session.goToPage(pageNumber)}
          />
        </div>
      </header>
      <div className={FavoritesPaneClass.content}>
        <SkeletonGrid
          isShown={computed(() => !finishedLoading.reached && session.results.value.length === 0)}
          dimensions={skeletonDimensions}
          layout={layout}
          size={size}
          count={skeletonItemCount}
        />
        <PostGrid
          posts={computed(() => session.paginationResult.value.favorites)}
          changed={favorites.hydrated}
          scrollTo={scrollTo}
          tileLocator={tileLocator}
          settings={props.gridPreferences}
          visiblePosts={visiblePosts}
          getDimensions={post => ({ width: post.getMetric("width"), height: post.getMetric("height") })}
          createActions={() => []}
          visibilityObserver={visibilityObserver}
          decodeImage={decodeImage}
          scheduler={scheduler}
          resolvePreviewUrl={resolvePreviewUrl}
          getPostUrl={getPostUrl}
          onPlainClick={onPlainClick}
          onCtrlClick={onCtrlClick}
          onPointerEnter={onPointerEnter}
        />
      </div>
    </section>
  );
}
