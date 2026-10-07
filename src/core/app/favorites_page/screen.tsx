import { Dimensions, MediaItem } from "@/core/domain/post/post";
import { PostGrid, PostGridPreferences } from "@/core/ui/post_grid/post_grid";
import { Fact } from "@/core/utils/reactive/milestone";
import { Favorites } from "@/core/features/favorites/types/favorites";
import { Media } from "@/core/domain/media/media";
import { Paginator } from "@/core/ui/components/paginator/paginator";
import { PostGridSkeleton } from "@/core/ui/post_grid/skeleton";
import { SearchBox } from "@/core/ui/components/search_box/search_box";
import { Slider } from "@/core/ui/components/slider/slider";
import { StatusText } from "@/core/ui/components/status_text/status_text";
import { computed } from "@/core/utils/reactive/signal";
import { describeLoadState } from "@/core/features/favorites/ui/load_status/load_status";
import { h } from "@/core/ui/h/h";

export const FavoritesScreenClass = {
  root: "fsg-FavoritesScreen",
  header: "fsg-FavoritesScreen-header",
  search: "fsg-FavoritesScreen-search",
  summary: "fsg-FavoritesScreen-summary",
  pagination: "fsg-FavoritesScreen-pagination",
  content: "fsg-FavoritesScreen-content"
} as const;

export interface FavoritesScreenProps {
  favorites: Pick<Favorites, "searchResults" | "paginationResult" | "hydrated" | "loadState" | "intents">;
  finishedLoading: Fact;
  skeletonDimensions: readonly Dimensions[];
  gridPreferences: PostGridPreferences;
  resolvePreviewUrl: (media: Media) => Promise<string>;
  getPostUrl: (post: MediaItem) => string;
  onActivatePost: (post: MediaItem, event: MouseEvent) => void;
}

export function FavoritesScreen(props: FavoritesScreenProps): HTMLElement {
  const { favorites, finishedLoading, skeletonDimensions, gridPreferences: { layout, size }, resolvePreviewUrl, getPostUrl, onActivatePost } = props;
  const { intents } = favorites;
  return (
    <div className={FavoritesScreenClass.root}>
      <header className={FavoritesScreenClass.header}>
        <div className={FavoritesScreenClass.search}>
          <SearchBox label="Search favorites" onSearch={query => intents.search(query)} />
          <Slider label="Size" min={1} max={20} step={1} value={computed(() => 21 - size.value)} onValueChange={next => size.set(21 - next)} />
        </div>
        <div className={FavoritesScreenClass.summary}>
          <StatusText text={computed(() => describeLoadState(favorites.loadState.value))} />
        </div>
        <div className={FavoritesScreenClass.pagination}>
          <Paginator
            pageNumber={computed(() => favorites.paginationResult.value.pageNumber)}
            pageCount={computed(() => favorites.paginationResult.value.totalPages)}
            onPageChange={pageNumber => intents.goToPage(pageNumber)}
          />
        </div>
      </header>
      <main className={FavoritesScreenClass.content}>
        <PostGridSkeleton
          isShown={computed(() => !finishedLoading.reached && favorites.searchResults.value.length === 0)}
          dimensions={skeletonDimensions}
          layout={layout}
          size={size}
        />
        <PostGrid
          posts={computed(() => favorites.paginationResult.value.favorites)}
          changed={favorites.hydrated}
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
