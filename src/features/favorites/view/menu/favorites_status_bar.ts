import * as FavoritesAPI from "../../../../lib/server/fetch/favorites_fetcher";
import { NewFavorites } from "../../type/favorite_types";
import { ON_MOBILE_DEVICE } from "../../../../lib/environment/environment";
import { Root } from "../../../../lib/shell";
import { Timeout } from "../../../../types/async";
import { getFavoritesPageId } from "../../../../lib/environment/favorites_metadata";

let matchCountIndicator: HTMLElement;
let statusIndicator: HTMLElement;
let expectedTotalFavoritesCount: number | null = null;
let statusTimeout: Timeout;
const TEMPORARY_STATUS_TIMEOUT = 1000;
const FETCHING_STATUS_PREFIX = ON_MOBILE_DEVICE ? "" : "Favorites ";

function clearStatus(): void {
  statusIndicator.textContent = "";
  statusIndicator.classList.add("hidden");
}

export function setStatus(text: string): void {
  clearTimeout(statusTimeout);
  statusIndicator.classList.remove("hidden");
  statusIndicator.textContent = text;
}

export function setTemporaryStatus(text: string): void {
  setStatus(text);
  clearTimeout(statusTimeout);
  statusTimeout = setTimeout(clearStatus, TEMPORARY_STATUS_TIMEOUT);
}

export function setMatchCount(value: number): void {
  matchCountIndicator.textContent = `${value} ${value === 1 ? "Result" : "Results"}`;
}

export function updateStatusWhileFetching(searchResultsCount: number, favoritesFoundCount: number): void {
  let statusText = `Fetching ${FETCHING_STATUS_PREFIX}${favoritesFoundCount}`;

  if (expectedTotalFavoritesCount !== null) {
    statusText = `${statusText} / ${expectedTotalFavoritesCount}`;
  }
  setStatus(statusText);
  setMatchCount(searchResultsCount);
}

export function notifyNewFavoritesFound(newFavorites: NewFavorites): void {
  const newFavoritesCount = newFavorites.newFavorites.length;

  if (newFavoritesCount > 0) {
    setStatus(`Found ${newFavoritesCount} new favorite${newFavoritesCount > 1 ? "s" : ""}`);
  }
}

async function setExpectedTotalFavoritesCount(): Promise<void> {
  expectedTotalFavoritesCount = await FavoritesAPI.fetchFavoritesCount(getFavoritesPageId() ?? "");
}

export function setupFavoritesStatus(): void {
  setExpectedTotalFavoritesCount();
  matchCountIndicator = Root.querySelector("#match-count-label") ?? document.createElement("label");
  statusIndicator = Root.querySelector("#favorites-load-status-label") ?? document.createElement("label");
}
