import { Favorites, FavoritesConfiguration, FavoritesDependencies } from "@/core/features/favorites/types/favorites";
import { FavoritesActionsFlow } from "@/core/features/favorites/flows/actions";
import { FavoritesLoadFlow } from "@/core/features/favorites/flows/load/load";
import { FavoritesModel } from "@/core/features/favorites/model/model";
import { FavoritesPagingFlow } from "@/core/features/favorites/flows/paging/paging";
import { FavoritesSearchFlow } from "@/core/features/favorites/flows/search";
import { FavoritesSkeletonFlow } from "@/core/features/favorites/flows/skeleton";
import { LoadPhase } from "@/core/features/favorites/types/load";
import { Post } from "@/core/domain/post/post";
import { SearchCriteria } from "@/core/features/favorites/types/search";
import { when } from "@/core/utils/reactive/milestone";

export function startFavorites(configuration: FavoritesConfiguration, dependencies: FavoritesDependencies): Favorites {
  const { remoteFavoriteActions } = dependencies;
  const terminalPhases: ReadonlySet<LoadPhase> = new Set(["loaded", "interrupted"]);
  const model = new FavoritesModel();
  const search = new FavoritesSearchFlow(configuration, { ...dependencies, model });
  const load = new FavoritesLoadFlow({ ...dependencies, model, getSearchCriteria: (): SearchCriteria => search.getSearchCriteria() });
  const finishedLoading = when(() => terminalPhases.has(load.state.value.phase));
  const paging = new FavoritesPagingFlow({ ...dependencies, model, canWrap: (): boolean => finishedLoading.reached });
  const actions = new FavoritesActionsFlow(dependencies);
  const skeleton = new FavoritesSkeletonFlow(dependencies);

  remoteFavoriteActions.added.on(id => actions.recordAddition(id));
  remoteFavoriteActions.removed.on(id => actions.recordRemoval(id));
  remoteFavoriteActions.removed.on(id => dependencies.localFavorites.remove([id]).catch(console.error));
  finishedLoading.wait()
    .then(() => skeleton.record(paging.posts.peek()))
    .catch(console.error);
  load.load();
  return {
    posts: paging.posts,
    query: search.query,
    hydrated: model.hydrated,
    finishedLoading,
    page: paging.page,
    loadState: load.state,
    favoritedById: actions.favoritedById,
    skeletonDimensions: skeleton.recordedDimensions,
    findPost: (id): Post | undefined => model.findPost(id),
    advance: (direction): Promise<boolean> => Promise.resolve(paging.advance(direction)),
    intents: {
      search: (query): void => search.search(query),
      shuffle: (): void => search.shuffle(),
      invert: (): void => search.invert(),
      sortBy: (sort): void => search.sortBy(sort),
      allowRatings: (ratings): void => search.allowRatings(ratings),
      setBlacklistEnabled: (enabled): void => search.setBlacklistEnabled(enabled),
      showPage: (pageNumber): void => paging.showPage(pageNumber),
      setInfiniteScrollEnabled: (enabled): void => paging.setInfiniteScrollEnabled(enabled),
      addFavorite: (id): Promise<void> => actions.addFavorite(id),
      removeFavorite: (id): Promise<void> => actions.removeFavorite(id)
    }
  };
}
