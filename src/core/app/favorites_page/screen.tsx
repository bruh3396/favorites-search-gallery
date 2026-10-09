import { Dimensions, MediaItem } from "@/core/domain/post/post";
import { PostGrid, PostGridPreferences } from "@/core/ui/post_grid/post_grid";
import { Fact } from "@/core/utils/reactive/milestone";
import { FavoritesSearchSession } from "@/core/features/favorites/search/session";
import { FavoritesService } from "@/core/features/favorites/favorites";
import { Media } from "@/core/domain/media/media";
import { PaginationSettings } from "@/core/features/favorites/search/pagination";
import { Paginator } from "@/core/ui/components/paginator/paginator";
import { PostGridSkeleton } from "@/core/ui/post_grid/skeleton";
import { Preference } from "@/core/utils/reactive/preference";
import { SearchBox } from "@/core/ui/components/search_box/search_box";
import { Slider } from "@/core/ui/components/slider/slider";
import { StatusText } from "@/core/ui/components/status_text/status_text";
import { computed } from "@/core/utils/reactive/signal";
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
  favorites: Pick<FavoritesService, "updates" | "loadState">;
  session: Pick<FavoritesSearchSession, "results" | "paginationResult" | "submit" | "goToPage">;
  paginationSettings: Preference<PaginationSettings>;
  finishedLoading: Fact;
  skeletonDimensions: readonly Dimensions[];
  gridPreferences: PostGridPreferences;
  resolvePreviewUrl: (media: Media) => Promise<string>;
  getPostUrl: (post: MediaItem) => string;
  onActivatePost: (post: MediaItem, event: MouseEvent) => void;
}

export function FavoritesScreen(props: FavoritesScreenProps): HTMLElement {
  const { favorites, session, paginationSettings, finishedLoading, skeletonDimensions, gridPreferences: { layout, size }, resolvePreviewUrl, getPostUrl, onActivatePost } = props;
  return (
    <div className={FavoritesScreenClass.root}>
      <header className={FavoritesScreenClass.header}>
        <div className={FavoritesScreenClass.search}>
          <SearchBox label="Search favorites" onSearch={query => session.submit(query)} />
          <Slider label="Size" min={1} max={20} step={1} value={computed(() => 21 - size.value)} onValueChange={next => size.set(21 - next)} />
          {/* TODO: quick page-size control; replace with a proper control (numbered choices, infinite scroll toggle). */}
          <Slider
            label="Results per page"
            min={MIN_PAGE_SIZE}
            max={MAX_PAGE_SIZE}
            step={PAGE_SIZE_STEP}
            value={computed(() => paginationSettings.value.size)}
            onValueChange={s => paginationSettings.set({ ...paginationSettings.peek(), size: s })}
          />
        </div>
        <div className={FavoritesScreenClass.summary}>
          <StatusText text={computed(() => describeLoadState(favorites.loadState.value))} />
        </div>
        <div className={FavoritesScreenClass.pagination}>
          <Paginator
            pageNumber={computed(() => session.paginationResult.value.pageNumber)}
            pageCount={computed(() => session.paginationResult.value.totalPages)}
            onPageChange={pageNumber => session.goToPage(pageNumber)}
          />
        </div>
      </header>
      <main className={FavoritesScreenClass.content}>
        <PostGridSkeleton
          isShown={computed(() => !finishedLoading.reached && session.results.value.length === 0)}
          dimensions={skeletonDimensions}
          layout={layout}
          size={size}
        />
        <PostGrid
          posts={computed(() => session.paginationResult.value.favorites)}
          changed={favorites.updates}
          layout={layout}
          size={size}
          getDimensions={post => ({ width: post.getMetric("width"), height: post.getMetric("height") })}
          createActions={() => []}
          resolvePreviewUrl={resolvePreviewUrl}
          getPostUrl={getPostUrl}
          onActivatePost={onActivatePost}
        />
      </main>
    </div>
  );
}
