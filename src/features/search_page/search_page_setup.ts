import * as ContentTiler from "../../app/layout/content_tiler";
import * as SearchPageFavoriteButton from "./control/favorite_button";
import * as SearchPageFavoritesMarkerFlow from "./flows/favorites_marker_flow";
import * as SearchPageModel from "./model/search_page_model";
import * as SearchPageNavigationFlow from "./flows/navigation_flow";
import * as SearchPageOptionFlow from "./flows/option_flow";
import * as SearchPageView from "./view/search_page_view";
import { Events } from "../../app/channels/events";
import { FeatureBridge } from "../../app/channels/feature_bridge";
import { Preferences } from "../../app/context/preferences";
import { SEARCH_PAGE_DISABLED } from "../../app/context/flags";

export async function setupSearchPage(): Promise<void> {
  if (SEARCH_PAGE_DISABLED) {
    return;
  }
  setupModel();
  await setupView();
  setupControl();
  await setupFavoriteIndicator();
  subscribeToEvents();
  registerBridgeHandlers();
  Events.searchPage.initialSearchPageCreated.emit(SearchPageModel.getInitialSearchPage());
  Events.searchPage.searchPageInitialized.emit();
}

function setupModel(): void {
  SearchPageModel.setup();
}

function setupView(): Promise<void> {
  return SearchPageView.setup();
}

function setupControl(): void {
  SearchPageFavoriteButton.setupAddFavoriteButtons(SearchPageModel.allThumbs());
  Events.searchPage.pageChanged.on(SearchPageFavoriteButton.setupAddFavoriteButtons);
  Events.searchPage.moreResultsAdded.on(SearchPageFavoriteButton.setupAddFavoriteButtons);
}

async function setupFavoriteIndicator(): Promise<void> {
  Events.searchPage.pageChanged.on(SearchPageFavoritesMarkerFlow.markExistingFavoritesIfEnabled);
  Events.searchPage.moreResultsAdded.on(SearchPageFavoritesMarkerFlow.markExistingFavoritesIfEnabled);
  Events.favorites.favoriteAdded.on(SearchPageFavoritesMarkerFlow.onFavoriteAdded);
  Events.searchPage.favoriteIndicatorToggled.on(SearchPageOptionFlow.toggleFavoriteIndicator);
  Events.searchPage.favoriteIndicatorStyleChanged.on(SearchPageView.applyCurrentFavoriteStyle);
  Events.gallery.displayedThumb.on(SearchPageView.applyGalleryFavoriteStyle);

  if (Preferences.searchPageFavoriteIndicator.value) {
    await SearchPageFavoritesMarkerFlow.toggleIndicator(true);
  }
}

function subscribeToEvents(): void {
  Events.searchPage.layoutChanged.on(ContentTiler.changeLayout);
  Events.searchPage.infiniteScrollToggled.on(SearchPageOptionFlow.toggleInfiniteScroll);
}

function registerBridgeHandlers(): void {
  FeatureBridge.currentSearchQuery.register(SearchPageView.currentSearch);
  FeatureBridge.navigateToAdjacentSearchPage.register(SearchPageNavigationFlow.navigateSearchPages);
  FeatureBridge.searchPageThumbs.register(SearchPageModel.allThumbs);
  FeatureBridge.usingInfiniteScroll.register(() => Preferences.searchPageInfiniteScroll.value);
}
