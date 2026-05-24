import * as Eta from "./eta";
import { FavoritesFetchProgress, NewFavorites } from "../../types/favorite_types";
import { ON_MOBILE_DEVICE } from "../../../../lib/environment";
import { Root } from "../../../../app/layout/shell";
import { Timeout } from "../../../../types/async";

let matchCountIndicator: HTMLElement;
let statusIndicator: HTMLElement;
let totalFavoritesCount: number | null = null;
let statusTimeout: Timeout;
const TEMPORARY_STATUS_TIMEOUT = 1000;
const FETCHING_STATUS_PREFIX = ON_MOBILE_DEVICE ? "" : "all favorites ";

export function setStatus(text: string): void {
  clearTimeout(statusTimeout);
  statusIndicator.classList.remove("u-hidden");
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

export function updateStatus(progress: FavoritesFetchProgress): void {
  let statusText = `Fetching ${FETCHING_STATUS_PREFIX}${progress.allFavoritesCount}`;

  if (totalFavoritesCount !== null) {
    statusText = `${statusText} / ${totalFavoritesCount}`;
    const eta = Eta.getEta(progress.allFavoritesCount, totalFavoritesCount);

    if (eta !== null) {
      statusText = `${statusText}${eta}`;
    }
  }
  setStatus(statusText);
  setMatchCount(progress.resultsCount);
}

export function notifyNewFavoritesFound(newFavorites: NewFavorites): void {
  const newFavoritesCount = newFavorites.newFavorites.length;

  if (newFavoritesCount > 0) {
    setStatus(`Found ${newFavoritesCount} new favorite${newFavoritesCount > 1 ? "s" : ""}`);
  }
}

export function setExpectedTotalFavoritesCount(count: number | null): void {
  totalFavoritesCount = count;
}

export function setup(): void {
  matchCountIndicator = Root.querySelector("#match-count-label") ?? document.createElement("label");
  statusIndicator = Root.querySelector("#favorites-load-status-label") ?? document.createElement("label");
}

function clearStatus(): void {
  statusIndicator.textContent = "";
  statusIndicator.classList.add("u-hidden");
}
