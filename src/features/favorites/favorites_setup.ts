import * as FavoritesControl from "./control/favorites_control";
import * as FavoritesDownloadMenu from "./features/downloader/menu";
import * as FavoritesInterFeatureFlow from "./flows/inter_feature_flow";
import * as FavoritesLoadFlow from "./flows/load_flow";
import * as FavoritesModel from "./model/favorites_model";
import * as FavoritesOptionsFlow from "./flows/option_flow";
import * as FavoritesPaginationFlow from "./flows/paginated_results_flow";
import * as FavoritesResetFlow from "./flows/reset_flow";
import * as FavoritesResultsFlow from "./flows/results_flow";
import * as FavoritesSearchFlow from "./flows/search_flow";
import * as FavoritesTagModifier from "./features/tag_modifier/tag_modifier";
import * as FavoritesView from "./view/favorites_view";
import * as PostApi from "../../lib/remote/api/post_fetcher";
import { DomEvents } from "../../lib/communication/dom_events";
import { Events } from "../../lib/communication/events";
import { FeatureBridge } from "../../lib/communication/feature_bridge";
import { ON_FAVORITES_PAGE } from "../../lib/environment/environment";

export async function setupFavorites(): Promise<void> {
  if (!ON_FAVORITES_PAGE) {
    return;
  }
  PostApi.setPostPageGate(Events.favorites.favoritesLoaded.wait());
  FavoritesModel.setup(FavoritesTagModifier.getAdditionalTags);
  FavoritesView.setup({
    onPageSelected: (pageNumber) => Events.favorites.pageSelected.emit(pageNumber),
    onRelativePageSelected: (relation) => Events.favorites.relativePageSelected.emit(relation)
  });
  FavoritesControl.setup();
  await setupSubFeatures();
  addEventListeners();
  FavoritesLoadFlow.loadAllFavorites();
}

async function setupSubFeatures(): Promise<void> {
  FavoritesDownloadMenu.setup({
    getSearchResults: () => FavoritesModel.getCurrentSearchResults()
  });
  Events.favorites.downloadButtonClicked.on(FavoritesDownloadMenu.openDownloadMenu);
  Events.favorites.favoritesLoaded.on(FavoritesDownloadMenu.enableDownloadMenu);

  await FavoritesTagModifier.setupFavoritesTagModifier({
    getSearchResults: () => FavoritesModel.getCurrentSearchResults(),
    getAllFavorites: () => FavoritesModel.getAllFavorites(),
    deIndex: (favorite) => FavoritesModel.removeFromIndex([favorite]),
    reIndex: (favorite) => FavoritesModel.addToIndex([favorite])
  });
  Events.favorites.searchResultsUpdated.on(FavoritesTagModifier.unselectAll);
  Events.favorites.pageChanged.on(FavoritesTagModifier.highlightSelectedThumbsOnPageChange);
  DomEvents.document.click.on(FavoritesTagModifier.handleDocumentClick);
}

function addEventListeners(): void {

  Events.favorites.searchStarted.on(FavoritesSearchFlow.searchFavorites);
  Events.favorites.shuffleButtonClicked.on(FavoritesSearchFlow.shuffleSearchResults);
  Events.favorites.invertButtonClicked.on(FavoritesSearchFlow.invertSearchResults);
  Events.favorites.findFavorite.on(FavoritesResultsFlow.reveal);
  Events.favorites.findFavoriteInAll.on(FavoritesSearchFlow.revealFavoriteInAll);
  Events.favorites.favoritesLoaded.on(FavoritesView.collectAspectRatios, { once: true });

  Events.favorites.pageSelected.on(FavoritesPaginationFlow.goToPage);
  Events.favorites.relativePageSelected.on(FavoritesPaginationFlow.goToRelativePage);

  Events.favorites.infiniteScrollToggled.on(FavoritesOptionsFlow.toggleInfiniteScroll);
  Events.favorites.blacklistToggled.on(FavoritesOptionsFlow.reSearchFavorites);
  Events.favorites.layoutChanged.on(FavoritesView.changeLayout);
  Events.favorites.sortAscendingToggled.on(FavoritesOptionsFlow.reSearchFavorites);
  Events.favorites.sortingMethodChanged.on(FavoritesOptionsFlow.reSearchFavorites);
  Events.favorites.allowedRatingsChanged.on(FavoritesOptionsFlow.reSearchFavorites);
  Events.favorites.resultsPerPageChanged.on(FavoritesOptionsFlow.setResultsPerPage);

  Events.favorites.setActiveFavoritesClicked.on(FavoritesModel.setActiveFavorites);
  Events.favorites.resetActiveFavoritesClicked.on(FavoritesModel.resetActiveFavorites);
  Events.favorites.resetButtonClicked.on(FavoritesResetFlow.attemptReset);
  Events.favorites.favoriteRemoved.on(FavoritesModel.deleteFavorite);

  Events.gallery.showOnHoverOverridden.on(FavoritesView.syncShowOnHoverFromGallery);
  Events.gallery.favoriteToggled.on(FavoritesInterFeatureFlow.swapFavoriteButton);

  FeatureBridge.loadMoreFavorites.register(FavoritesResultsFlow.loadMoreResults);
  FeatureBridge.favoritesCanExtend.register(FavoritesResultsFlow.hasMoreResults);
  FeatureBridge.favoritesSearchResults.register(FavoritesModel.getCurrentSearchResults);
  FeatureBridge.getFavorite.register(FavoritesModel.getFavorite);
  FeatureBridge.allFavorites.register(FavoritesModel.getAllFavorites);
  FeatureBridge.currentSearchQuery.register(FavoritesModel.getCurrentSearchQuery);
}
