import {FavoriteI} from "../types/favorite/interfaces";
import {FavoritesPageRequest} from "./request";
import {extractFavorites} from "./extractor";
import fetchQueue from "./queue";
import {sleep} from "../../../utils/misc/generic";

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
  pendingRequestPageNumbers.add(currentPageNumber);
  const request = new FavoritesPageRequest(currentPageNumber);

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
  fetch(request.url)
    .then((response) => {
      return onFavoritesPageRequestResponse(response);
    })
    .then((html) => {
      onFavoritesPageRequestSuccess(request, html);
    })
    .catch((error) => {
      onFavoritesPageRequestError(request, error);
    });
  await sleep(request.fetchDelay);
}

function onFavoritesPageRequestResponse(response: Response): Promise<string> {
  if (response.ok) {
    return response.text();
  }
  throw new Error(`${response.status}: Failed to fetch, ${response.url}`);
}

function onFavoritesPageRequestSuccess(request: FavoritesPageRequest, html: string): void {
  request.complete(html);
  pendingRequestPageNumbers.delete(request.pageNumber);
  const favoritesPageIsEmpty = html === "";

  fetchedAnEmptyPage = fetchedAnEmptyPage || favoritesPageIsEmpty;

  if (!favoritesPageIsEmpty) {
    fetchQueue.enqueue(request);
  }
}

function onFavoritesPageRequestError(request: FavoritesPageRequest, error: Error): void {
  console.error(error);
  request.retry();
  failedRequests.push(request);
}

function fetchNewFavoritesOnReloadHelper(): Promise<{ allNewFavoritesFound: boolean, newFavorites: FavoriteI[] }> {
  return fetch(newFetchRequest().url)
    .then((response) => {
      return response.text();
    })
    .then((html) => {
      return extractNewFavorites(html);
    });
}

function extractNewFavorites(html: string): { allNewFavoritesFound: boolean, newFavorites: FavoriteI[] } {
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

async function fetchAllFavorites(onFavoritesFound: (request: FavoritesPageRequest) => void): Promise<void> {
  fetchQueue.setDequeueCallback(onFavoritesFound);

  while (!allRequestsHaveCompleted()) {
    await fetchFavoritesPage(nextFetchRequest());
  }
}

async function fetchNewFavoritesOnReload(ids: Set<string>): Promise<FavoriteI[]> {
  await sleep(100);
  storedFavoriteIds = ids;
  let favorites: FavoriteI[] = [];

  while (true) {
    const {allNewFavoritesFound, newFavorites} = await fetchNewFavoritesOnReloadHelper();

    favorites = favorites.concat(newFavorites);

    if (allNewFavoritesFound) {
      storedFavoriteIds.clear();
      return favorites;
    }
  }
}

const favoritesFetcher = {
  fetchAllFavorites,
  fetchNewFavoritesOnReload
};

export default favoritesFetcher;
