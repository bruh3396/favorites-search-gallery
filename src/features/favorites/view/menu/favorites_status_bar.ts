import * as API from "../../../../lib/api/api";
import { FAVORITES_SEARCH_GALLERY_CONTAINER } from "../../../../lib/globals/container";
import { ON_MOBILE_DEVICE } from "../../../../lib/globals/flags";
import { Timeout } from "../../../../types/primitives/primitives";

let matchCountIndicator: HTMLElement = document.createElement("label");
let statusIndicator: HTMLElement = document.createElement("label");
let expectedTotalFavoritesCount: number | null = null;
let statusTimeout: Timeout;
const TEMPORARY_STATUS_TIMEOUT = 1000;

export function setStatus(text: string): void {
  statusIndicator.textContent = text;
}

export function clearStatus(): void {
  statusIndicator.textContent = "";
}

export function setTemporaryStatus(text: string): void {
  setStatus(text);
  clearTimeout(statusTimeout);
  statusTimeout = setTimeout(clearStatus, TEMPORARY_STATUS_TIMEOUT);
}

export function setMatchCount(value: number): void {
  matchCountIndicator.textContent = `${value} ${value === 1 ? "Match" : "Matches"}`;
}

export function updateStatusWhileFetching(searchResultsCount: number, favoritesFoundCount: number): void {
  const prefix = ON_MOBILE_DEVICE ? "" : "Favorites ";
  let statusText = `Fetching ${prefix}${favoritesFoundCount}`;

  if (expectedTotalFavoritesCount !== null) {
    statusText = `${statusText} / ${expectedTotalFavoritesCount}`;
  }
  setStatus(statusText);
  setMatchCount(searchResultsCount);
}

export function notifyNewFavoritesFound(newFavoritesCount: number): void {
  if (newFavoritesCount > 0) {
    const pluralSuffix = newFavoritesCount > 1 ? "s" : "";

    setStatus(`Found ${newFavoritesCount} new favorite${pluralSuffix}`);
  }
}

 async function setExpectedTotalFavoritesCount(): Promise<void> {
  expectedTotalFavoritesCount = await API.getFavoritesCount();
}

export function setupFavoritesStatus(): void {
  setExpectedTotalFavoritesCount();
  matchCountIndicator = FAVORITES_SEARCH_GALLERY_CONTAINER.querySelector("#match-count-label") || statusIndicator;
  statusIndicator = FAVORITES_SEARCH_GALLERY_CONTAINER.querySelector("#favorites-load-status-label") || matchCountIndicator;
}
