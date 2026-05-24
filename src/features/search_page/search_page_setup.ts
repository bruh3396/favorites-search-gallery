import * as ContentTiler from "../../app/layout/content_tiler";
import * as MarkFavoriteThumbsFlow from "./flows/mark_favorite_thumbs_flow";
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

async function setupFavoriteIndicator(): Promise<void> {
  if (!Preferences.searchPageFavoriteIndicator.value) {
    return;
  }
  SearchPageView.setFavoriteIndicatorLoading(true);
  SearchPageModel.populateFavoriteIds(await FeatureBridge.favoriteIds.call());
  MarkFavoriteThumbsFlow.markFavoriteThumbs(SearchPageModel.allThumbs());
  SearchPageView.setFavoriteIndicatorLoading(false);
  Events.searchPage.pageChanged.on(MarkFavoriteThumbsFlow.markFavoriteThumbs);
  Events.searchPage.moreResultsAdded.on(MarkFavoriteThumbsFlow.markFavoriteThumbs);
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
