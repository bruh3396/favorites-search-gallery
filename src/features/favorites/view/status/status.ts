import * as FavoritesEta from "@/features/favorites/view/status/eta";
import { FavoritesFetchProgress, NewFavorites } from "@/features/favorites/types/types";
import { FavoritesId } from "@/features/favorites/types/scaffold";
import { ProgressBar } from "@/types/element";
import { Root } from "@/app/layout/shell";
import { Timeout } from "@/types/async";
import { buildProgressBar } from "@/lib/ui/widgets/progress_bar";
import { pluralize } from "@/utils/string/format";

let matchCountIndicator: HTMLElement;
let statusIndicator: HTMLElement;
let progressBar: ProgressBar;
let totalFavoritesCount: number | null = null;
let statusTimeout: Timeout;
const TEMPORARY_STATUS_TIMEOUT = 1_000;

export function setStatus(text: string): void {
  clearTimeout(statusTimeout);
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
  let statusText = `Fetching ${progress.allFavoritesCount}`;

  if (totalFavoritesCount !== null) {
    statusText = `${statusText} / ${totalFavoritesCount}`;
    const eta = FavoritesEta.getEta(progress.allFavoritesCount, totalFavoritesCount);

    if (eta !== null) {
      statusText = `${statusText}${eta}`;
    }
    progressBar.setProgress(progress.allFavoritesCount, totalFavoritesCount);
    progressBar.setVisible(true);
  }
  setStatus(statusText);
  setMatchCount(progress.resultsCount);
}

export function notifyNewFavoritesFound(newFavorites: NewFavorites): void {
  const newFavoritesCount = newFavorites.newFavorites.length;

  if (newFavoritesCount > 0) {
    setStatus(`Found ${newFavoritesCount} new favorite${pluralize(newFavoritesCount)}`);
  }
}

export function setExpectedTotalFavoritesCount(count: number | null): void {
  totalFavoritesCount = count;
}

export function setup(): void {
  matchCountIndicator = Root.querySelector(`#${FavoritesId.matchCount}`) ?? document.createElement("label");
  statusIndicator = Root.querySelector(`#${FavoritesId.loadStatus}`) ?? document.createElement("label");
  progressBar = buildProgressBar(FavoritesId.loadProgressBar);
  Root.querySelector(`#${FavoritesId.toolbar}`)?.append(progressBar.element);
}

function clearStatus(): void {
  statusIndicator.textContent = "";
  progressBar.setVisible(false);
}
