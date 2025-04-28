import * as FavoritesFetchQueue from "./queue";
import * as API from "../../../../lib/api/api";
import {FavoriteItem} from "../../types/favorite/favorite";
import {FavoritesPageRequest} from "./request";
import {extractFavorites} from "./extractor";
import {sleep} from "../../../../utils/misc/generic";

const pendingRequestPageNumbers = new Set<number>();
const failedRequests: FavoritesPageRequest[] = [];
let storedFavoriteIds = new Set<string>();
let currentPageNumber = 0;
let fetchedAnEmptyPage = false;

function hasFailedRequests(): boolean {
  return failedRequests.length > 0;
}

function allRequestsHaveStarted(): boolean {
  return fetchedAnEmptyPage;
}

function someRequestsArePending(): boolean {
  return pendingRequestPageNumbers.size > 0 || hasFailedRequests();
}

function allRequestsHaveCompleted(): boolean {
  return allRequestsHaveStarted() && !someRequestsArePending();
}

function oldestFailedFetchRequest(): FavoritesPageRequest | null {
  return failedRequests.shift() || null;
}

function newFetchRequest(): FavoritesPageRequest {
  const request = new FavoritesPageRequest(currentPageNumber);

  pendingRequestPageNumbers.add(request.realPageNumber);
  currentPageNumber += 1;
  return request;
}

function nextFetchRequest(): FavoritesPageRequest | null {
  if (hasFailedRequests()) {
    return oldestFailedFetchRequest();
  }

  if (!allRequestsHaveStarted()) {
    return newFetchRequest();
  }
  return null;
}

async function fetchFavoritesPage(request: FavoritesPageRequest | null): Promise<void> {
  if (request === null) {
    await sleep(200);
    return;
  }
  await fetchFavoritesPageHelper(request);
}

async function fetchFavoritesPageHelper(request: FavoritesPageRequest): Promise<void> {
  API.fetchFavoritesPage(request.realPageNumber)
    .then((html) => {
      onFavoritesPageRequestSuccess(request, html);
    })
    .catch((error) => {
      onFavoritesPageRequestError(request, error);
    });
  await sleep(request.fetchDelay);
}

function onFavoritesPageRequestSuccess(request: FavoritesPageRequest, html: string): void {
  request.complete(html);
  pendingRequestPageNumbers.delete(request.realPageNumber);
  const favoritesPageIsEmpty = request.favorites.length === 0;

  fetchedAnEmptyPage = fetchedAnEmptyPage || favoritesPageIsEmpty;

  if (!favoritesPageIsEmpty) {
    FavoritesFetchQueue.enqueue(request);
  }
}

function onFavoritesPageRequestError(request: FavoritesPageRequest, error: Error): void {
  console.error(error);
  request.retry();
  failedRequests.push(request);
}

function fetchNewFavoritesOnReloadHelper(): Promise<{ allNewFavoritesFound: boolean, newFavorites: FavoriteItem[] }> {
  return API.fetchFavoritesPage(newFetchRequest().realPageNumber)
    .then((html) => {
      return extractNewFavorites(html);
    });
}

function extractNewFavorites(html: string): { allNewFavoritesFound: boolean, newFavorites: FavoriteItem[] } {
  const newFavorites = [];
  const fetchedFavorites = extractFavorites(html);
  let allNewFavoritesFound = fetchedFavorites.length === 0;

  for (const favorite of fetchedFavorites) {
    if (storedFavoriteIds.has(favorite.id)) {
      allNewFavoritesFound = true;
      break;
    }
    newFavorites.push(favorite);
  }
  return {
    allNewFavoritesFound,
    newFavorites
  };
}

export async function fetchAllFavorites(onFavoritesFound: (favorites: FavoriteItem[]) => void): Promise<void> {
  FavoritesFetchQueue.setDequeueCallback(onFavoritesFound);

  while (!allRequestsHaveCompleted()) {
    await fetchFavoritesPage(nextFetchRequest());
  }
}

export async function fetchNewFavoritesOnReload(ids: Set<string>): Promise<FavoriteItem[]> {
  await sleep(100);
  storedFavoriteIds = ids;
  let favorites: FavoriteItem[] = [];

  while (true) {
    const {allNewFavoritesFound, newFavorites} = await fetchNewFavoritesOnReloadHelper();

    favorites = favorites.concat(newFavorites);

    if (allNewFavoritesFound) {
      storedFavoriteIds.clear();
      return favorites;
    }
  }
}
