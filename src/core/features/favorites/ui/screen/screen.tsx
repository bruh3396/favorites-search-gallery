import { PostGrid, PostGridPreferences } from "@/core/ui/post_grid/post_grid";
import { Favorites } from "@/core/features/favorites/types/favorites";
import { Media } from "@/core/domain/media/media";
import { MediaItem } from "@/core/domain/post/post";
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
  content: "fsg-FavoritesScreen-content",
  footer: "fsg-FavoritesScreen-footer",
  pager: "fsg-FavoritesScreen-pager"
} as const;

export interface FavoritesScreenProps {
  favorites: Pick<Favorites, "posts" | "query" | "hydrated" | "finishedLoading" | "page" | "loadState" | "skeletonDimensions" | "intents">;
  gridPreferences: PostGridPreferences;
  resolvePreviewUrl: (media: Media) => Promise<string>;
  getPostUrl: (post: MediaItem) => string;
  onActivatePost: (post: MediaItem, event: MouseEvent) => void;
}

export function FavoritesScreen(props: FavoritesScreenProps): HTMLElement {
  const { favorites, gridPreferences: { layout, size }, resolvePreviewUrl, getPostUrl, onActivatePost } = props;
  const { intents } = favorites;
  return (
    <div className={FavoritesScreenClass.root}>
      <header className={FavoritesScreenClass.header}>
        <div className={FavoritesScreenClass.search}>
          <SearchBox label="Search favorites" query={favorites.query} onSearch={intents.search} />
          <Slider label="Size" min={1} max={20} step={1} value={computed(() => 21 - size.value)} onValueChange={next => size.set(21 - next)} />
        </div>
        <div className={FavoritesScreenClass.summary}>
          <StatusText text={computed(() => describeLoadState(favorites.loadState.value))} />
        </div>
      </header>
      <main className={FavoritesScreenClass.content}>
        <PostGridSkeleton
          isShown={computed(() => !favorites.finishedLoading.reached && favorites.posts.value.length === 0)}
          dimensions={favorites.skeletonDimensions}
          layout={layout}
          size={size}
        />
        <PostGrid
          posts={favorites.posts}
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
      <footer className={FavoritesScreenClass.footer}>
        <div className={FavoritesScreenClass.pager}>
          <Paginator
            pageNumber={computed(() => favorites.page.value.pageNumber)}
            pageCount={computed(() => favorites.page.value.pageCount)}
            onPageChange={intents.showPage}
          />
        </div>
      </footer>
    </div>
  );
}
