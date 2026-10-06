import { PostGridPreferences, createPostGrid } from "@/core/ui/post_grid/post_grid";
import { Favorites } from "@/core/features/favorites/types/favorites";
import { Media } from "@/core/domain/media/media";
import { computed } from "@/core/utils/reactive/signal";
import { createFavoriteHearts } from "@/core/features/favorites/ui/hearts/hearts";
import { createFavoritesScaffold } from "@/core/features/favorites/ui/scaffold/scaffold";
import { createPaginator } from "@/core/ui/components/paginator/paginator";
import { createPostGridSkeleton } from "@/core/ui/post_grid/skeleton";
import { createSearchBox } from "@/core/ui/components/search_box/search_box";
import { createSlider } from "@/core/ui/components/slider/slider";
import { createStatusText } from "@/core/ui/components/status_text/status_text";
import { describeLoadState } from "@/core/features/favorites/ui/load_status/load_status";

export interface FavoritesScreenDependencies {
  favorites: Pick<Favorites, "posts" | "query" | "hydrated" | "finishedLoading" | "page" | "loadState" | "favoritedChanges" | "skeletonDimensions" | "intents">;
  gridPreferences: PostGridPreferences;
  resolvePreviewUrl: (media: Media) => Promise<string>;
}

export interface FavoritesScreen {
  readonly element: HTMLElement;
  dispose: () => void;
}

export function createFavoritesScreen(ownerDocument: Document, dependencies: FavoritesScreenDependencies): FavoritesScreen {
  const { favorites, gridPreferences: { layout, size }, resolvePreviewUrl } = dependencies;
  const scaffold = createFavoritesScaffold(ownerDocument);
  const sizeSlider = createSlider(ownerDocument, {
    label: "Size",
    min: 1,
    max: 20,
    step: 1,
    value: computed(() => 21 - size.value),
    onValueChange: (next): void => size.set(21 - next)
  });
  const hearts = createFavoriteHearts(ownerDocument, {
    container: scaffold.content,
    favoritedChanges: favorites.favoritedChanges,
    addFavorite: id => favorites.intents.addFavorite(id),
    removeFavorite: id => favorites.intents.removeFavorite(id)
  });
  const grid = createPostGrid(ownerDocument, {
    posts: favorites.posts,
    changed: favorites.hydrated,
    layout,
    size,
    getDimensions: post => ({ width: post.getMetric("width"), height: post.getMetric("height") }),
    createActions: post => [hearts.createHeart(post.id)],
    resolvePreviewUrl
  });
  const searchBox = createSearchBox(ownerDocument, {
    label: "Search favorites",
    query: favorites.query,
    onSearch: query => favorites.intents.search(query)
  });
  const skeleton = createPostGridSkeleton(ownerDocument, {
    isShown: computed(() => !favorites.finishedLoading.reached && favorites.posts.value.length === 0),
    dimensions: favorites.skeletonDimensions,
    layout,
    size
  });
  const status = createStatusText(ownerDocument, { text: computed(() => describeLoadState(favorites.loadState.value)) });
  const paginator = createPaginator(ownerDocument, {
    pageNumber: computed(() => favorites.page.value.pageNumber),
    pageCount: computed(() => favorites.page.value.pageCount),
    onPageChange: pageNumber => favorites.intents.showPage(pageNumber)
  });

  scaffold.search.append(searchBox.element, sizeSlider.element);
  scaffold.summary.append(status.element);
  scaffold.pager.append(paginator.element);
  scaffold.content.append(skeleton.element, grid.element);
  return {
    element: scaffold.element,
    dispose: (): void => {
      [sizeSlider, hearts, grid, searchBox, skeleton, status, paginator].forEach(part => part.dispose());
    }
  };
}
