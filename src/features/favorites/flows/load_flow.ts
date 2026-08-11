import * as FavoritesModel from "@/features/favorites/model/favorites_model";
import * as FavoritesResultsFlow from "@/features/favorites/flows/results_flow";
import * as FavoritesSearchFlow from "@/features/favorites/flows/search_flow";
import * as FavoritesView from "@/features/favorites/view/favorites_view";
import { Events } from "@/app/channels/events";
import { ON_FIRST_FAVORITES_PAGE } from "@/lib/environment";
import { fetchFavoritesCount } from "@/lib/remote/rule34/favorites/page";
import { markAsNew } from "@/features/favorites/dom_tweaks/indicator";

export async function loadAllFavorites(nativeFavorites: HTMLElement[] | undefined): Promise<void> {
  if (await hasStoredFavorites()) {
    await loadStoredFavorites();
    await fetchNewFavorites(nativeFavorites);
  } else {
    await fetchAllFavorites(nativeFavorites);
  }
  Events.favorites.favoritesLoaded.emit();
  FavoritesView.collectAspectRatios();
}

async function hasStoredFavorites(): Promise<boolean> {
  const hasFavorites = await FavoritesModel.hasStoredFavorites();

  Events.favorites.storedFavoritesFound.emit(hasFavorites);
  return hasFavorites;
}

async function loadStoredFavorites(): Promise<void> {
  FavoritesView.setStatus("Loading favorites");
  await FavoritesModel.loadStoredFavorites();
  Events.favorites.storedFavoritesLoaded.emit();
  FavoritesView.setTemporaryStatus("Favorites loaded");
  FavoritesSearchFlow.reSearchFavorites();
}

async function fetchNewFavorites(nativeFavorites: HTMLElement[] | undefined): Promise<void> {
  FavoritesView.setStatus("Finding new favorites");
  const results = await FavoritesModel.fetchNewFavorites(firstPageFavorites(nativeFavorites));

  if (results.newSearchResults.length === 0) {
    FavoritesView.setTemporaryStatus("No new favorites found");
    return;
  }
  await FavoritesModel.storeFavorites(results.newFavorites);
  results.newSearchResults.forEach(markAsNew);
  FavoritesView.addToTop(results.newSearchResults);
  FavoritesView.notifyNewFavoritesFound(results);
  FavoritesView.setTemporaryStatus(`Saved ${results.newFavorites.length} new favorites`);
  FavoritesModel.repaginateCurrentResults();
  Events.favorites.newFavoritesFound.emit(results.newSearchResults);
  Events.favorites.searchResultsUpdated.emit(FavoritesModel.getCurrentSearchResults());
}

async function fetchAllFavorites(nativeFavorites: HTMLElement[] | undefined): Promise<void> {
  fetchFavoritesCount().then(FavoritesView.setExpectedTotalFavoritesCount);
  FavoritesResultsFlow.clearResults();
  await FavoritesModel.fetchAllFavorites(FavoritesResultsFlow.syncResults, firstPageFavorites(nativeFavorites));
  FavoritesView.setStatus("Saving favorites");
  await FavoritesModel.storeFavorites(FavoritesModel.getAllFavorites());
  FavoritesView.setTemporaryStatus("All favorites saved");
}

function firstPageFavorites(nativeFavorites: HTMLElement[] | undefined): HTMLElement[] | undefined {
  return ON_FIRST_FAVORITES_PAGE ? nativeFavorites : undefined;
}
