import { Dimensions, MediaItem } from "@/core/domain/post/post";
import { Signal, computed } from "@/core/utils/reactive/signal";
import { BitmapDecoder } from "@/core/boundary/ports/bitmap_decoder/bitmap_decoder";
import { Fact } from "@/core/utils/reactive/milestone";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesSearchSession } from "@/core/features/favorites/search/session";
import { FavoritesService } from "@/core/features/favorites/favorites";
import { Media } from "@/core/domain/media/media";
import { Occurrence } from "@/core/utils/reactive/emitter";
import { PaginationSettings } from "@/core/features/favorites/search/pagination";
import { Paginator } from "@/core/ui/components/paginator/paginator";
import { PostGrid } from "@/core/ui/post_grid/post_grid";
import { PostGridPreferences } from "@/core/app/preferences";
import { PostGridSkeleton } from "@/core/ui/post_grid/skeleton";
import { Preference } from "@/core/utils/reactive/preference";
import { SearchBox } from "@/core/ui/components/search_box/search_box";
import { Slider } from "@/core/ui/components/slider/slider";
import { StatusText } from "@/core/ui/components/status_text/status_text";
import { Switch } from "@/core/ui/components/switch/switch";
import { VisibilityObserver } from "@/core/boundary/ports/visibility_observer/visibility_observer";
import { describeLoadState } from "@/core/features/favorites/load/status";
import { h } from "@/core/ui/h/h";

export const FavoritesScreenClass = {
  root: "fsg-FavoritesScreen",
  header: "fsg-FavoritesScreen-header",
  search: "fsg-FavoritesScreen-search",
  summary: "fsg-FavoritesScreen-summary",
  pagination: "fsg-FavoritesScreen-pagination",
  content: "fsg-FavoritesScreen-content"
} as const;

const MIN_PAGE_SIZE = 1;
const MAX_PAGE_SIZE = 100;
const PAGE_SIZE_STEP = 10;

export interface FavoritesScreenProps {
  readonly favorites: Pick<FavoritesService, "hydrated" | "loadState">;
  readonly session: Pick<FavoritesSearchSession, "results" | "paginationResult" | "submit" | "goToPage">;
  readonly scrollTo: Occurrence<Favorite>;
  readonly paginationSettings: Preference<PaginationSettings>;
  readonly finishedLoading: Fact;
  readonly skeletonDimensions: readonly Dimensions[];
  readonly skeletonItemCount: number;
  readonly gridPreferences: PostGridPreferences;
  readonly visiblePosts: Signal<readonly Favorite[]>;
  readonly bitmapDecoder: BitmapDecoder;
  readonly visibilityObserver: VisibilityObserver;
  readonly fetchImage: (media: Media, signal: AbortSignal) => Promise<Blob>;
  readonly resolvePreviewUrl: (media: Media) => Promise<string>;
  readonly getPostUrl: (post: MediaItem) => string;
  readonly onActivatePost: (post: Favorite, event: MouseEvent) => void;
}

export function FavoritesScreen(props: FavoritesScreenProps): HTMLElement {
  const { favorites, session, scrollTo, paginationSettings, finishedLoading,
    skeletonDimensions, gridPreferences: { layout, size, upscale }, visiblePosts, bitmapDecoder, skeletonItemCount,
    visibilityObserver, fetchImage, resolvePreviewUrl, getPostUrl, onActivatePost } = props;
  return (
    <div className={FavoritesScreenClass.root}>
      <header className={FavoritesScreenClass.header}>
        <div className={FavoritesScreenClass.search}>
          <SearchBox label="Search favorites" onSearch={query => session.submit(query)} />
          <Slider label="Size" min={1} max={20} step={1} value={computed(() => 21 - size.value)} onValueChange={next => size.set(21 - next)} />
          <Slider
            label="Results per page"
            min={MIN_PAGE_SIZE}
            max={MAX_PAGE_SIZE}
            step={PAGE_SIZE_STEP}
            value={computed(() => paginationSettings.value.size)}
            onValueChange={s => paginationSettings.set({ ...paginationSettings.peek(), size: s })}
          />
          <Switch value={upscale} onValueChange={next => upscale.set(next)} />
          <div className={FavoritesScreenClass.pagination}>
            <Paginator
              pageNumber={computed(() => session.paginationResult.value.pageNumber)}
              pageCount={computed(() => session.paginationResult.value.totalPages)}
              onPageChange={pageNumber => session.goToPage(pageNumber)}
            />
          </div>
        </div>
        <div className={FavoritesScreenClass.summary}>
          <StatusText text={computed(() => describeLoadState(favorites.loadState.value))} />
        </div>

      </header>
      <main className={FavoritesScreenClass.content}>
        <PostGridSkeleton
          isShown={computed(() => !finishedLoading.reached && session.results.value.length === 0)}
          dimensions={skeletonDimensions}
          layout={layout}
          size={size}
          count={skeletonItemCount}
          bitmapDecoder={bitmapDecoder}
          visibilityObserver={visibilityObserver}
          fetchImage={fetchImage}
        />
        <PostGrid
          posts={computed(() => session.paginationResult.value.favorites)}
          changed={favorites.hydrated}
          scrollTo={scrollTo}
          settings={props.gridPreferences}
          visiblePosts={visiblePosts}
          getDimensions={post => ({ width: post.getMetric("width"), height: post.getMetric("height") })}
          createActions={() => []}
          bitmapDecoder={bitmapDecoder}
          visibilityObserver={visibilityObserver}
          fetchImage={fetchImage}
          resolvePreviewUrl={resolvePreviewUrl}
          getPostUrl={getPostUrl}
          onActivatePost={onActivatePost}
        />
      </main>
    </div>
  );
}
