import * as FavoritesDownloader from "./downloader";
import { sleep, yieldControl } from "../../../../lib/core/scheduling/promise";
import { DOWNLOADER_DISABLED } from "../../../../lib/environment/derived_environment";
import { DOWNLOADER_HTML } from "../../../../assets/html";
import { DownloadRequest } from "./download_request";
import { Favorite } from "../../../../types/favorite";
import { Overlays } from "../../../../lib/shell";
import { Preferences } from "../../../../lib/preferences/preferences";
import { insertHtmlWithStyles } from "../../../../lib/dom/injector";
import { splitIntoChunks } from "../../../../utils/collection/array";
import { toggleGlobalInputEvents } from "../../../../lib/communication/dom_event_bridge";

type FavoritesDownloaderInterface = {
  getSearchResults: () => Favorite[]
}

let dialog: HTMLDialogElement;
let warningDialog: HTMLDialogElement;
let downloadButton: HTMLButtonElement;
let cancelButton: HTMLButtonElement;
let statusContainer: HTMLElement;
let statusHeader: HTMLElement;
let enabled: boolean = false;
let favoritesDownloaderInterface: FavoritesDownloaderInterface;

export function setupDownloadMenu(fdInterface: FavoritesDownloaderInterface): void {
  if (DOWNLOADER_DISABLED) {
    return;
  }
  favoritesDownloaderInterface = fdInterface;
  FavoritesDownloader.setupFavoritesDownloader();
  insertHtmlWithStyles(Overlays, "beforeend", DOWNLOADER_HTML);
  dialog = getDialog("download-menu");
  warningDialog = getDialog("download-menu-warning");
  downloadButton = getDownloadButton();
  cancelButton = getCancelButton();
  statusContainer = getStatusContainer();
  statusHeader = getStatusHeader();
  addEventListeners();
}

export function openDownloadMenu(): void {
  if (enabled) {
    downloadButton.disabled = false;
    dialog.showModal();
    statusHeader.textContent = `Download ${favoritesDownloaderInterface.getSearchResults().length} Results`;
  } else {
    warningDialog.showModal();
  }
  toggleGlobalInputEvents(false);
  document.body.classList.add("dialog-opened");
}

export function enableDownloadMenu(): void {
  enabled = true;
}

function getDialog(id: string): HTMLDialogElement {
  const newDialog = document.getElementById(id);
  return newDialog instanceof HTMLDialogElement ? newDialog : document.createElement("dialog");
}

function getDownloadButton(): HTMLButtonElement {
  const button = document.getElementById("download-menu-buttons-start-download");

  if (!(button instanceof HTMLButtonElement)) {
    return document.createElement("button");
  }
  button.addEventListener("click", () => {
    button.disabled = true;
    downloadFavorites(favoritesDownloaderInterface.getSearchResults());
  });
  return button;
}

function getCancelButton(): HTMLButtonElement {
  const button = document.getElementById("download-menu-buttons-cancel-download");

  if (!(button instanceof HTMLButtonElement)) {
    return document.createElement("button");
  }
  button.addEventListener("click", () => {
    dialog.close();
  });
  return button;
}

function getStatusContainer(): HTMLElement {
  const container = document.getElementById("download-menu-status");

  if (!(container instanceof HTMLElement)) {
    return document.createElement("div");
  }
  return container;
}

function getStatusHeader(): HTMLElement {
  const header = document.getElementById("download-menu-status-header");

  if (!(header instanceof HTMLElement)) {
    return document.createElement("div");
  }
  return header;
}

function createStatusTextRow(): HTMLElement {
  const row = document.createElement("span");

  row.classList.add("download-menu-status-row");
  statusContainer.appendChild(row);
  return row;
}

function addEventListeners(): void {
  setupMenuCancelHandler();
  setupMenuCloseHandler();
  setupMenuOptions();
}

function setupMenuCancelHandler(): void {
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
  });
}

function setupMenuCloseHandler(): void {
  dialog.addEventListener("close", async() => {
    cancelButton.textContent = "Cancel";
    toggleGlobalInputEvents(true);
    await yieldControl();
    document.body.classList.remove("dialog-opened");
    dialog.classList.remove("downloading");
    FavoritesDownloader.abort();
    clearStatusTextRows();
    downloadButton.disabled = true;
    await sleep(2000);
    downloadButton.disabled = false;
    FavoritesDownloader.reset();
  });
  warningDialog.addEventListener("close", () => {
    document.body.classList.remove("dialog-opened");
    toggleGlobalInputEvents(true);
  });
}

function setupMenuOptions(): void {
  setupMenuBatchSizeSelect();
}

function setupMenuBatchSizeSelect(): void {
  const batchSizeSelect = document.getElementById("download-menu-options-batch-size");

  if (!(batchSizeSelect instanceof HTMLSelectElement)) {
    return;
  }
  batchSizeSelect.value = String(Preferences.downloadBatchSize.value);

  batchSizeSelect.addEventListener("change", () => {
    Preferences.downloadBatchSize.set(parseInt(batchSizeSelect.value, 10));
  });
}

function clearStatusTextRows(): void {
  const rows = Array.from(statusContainer.querySelectorAll(".download-menu-status-row"));

  for (const row of rows) {
    row.remove();
  }
}

async function downloadFavorites(favorites: Favorite[]): Promise<void> {
  const favoriteCount = favorites.length;

  if (favoriteCount === 0) {
    finishDownload();
    return;
  }
  dialog.classList.add("downloading");
  statusHeader.textContent = `Downloading ${favoriteCount} Results`;
  const batches = splitIntoChunks(favorites, Preferences.downloadBatchSize.value);
  const totalProgressRow = createStatusTextRow();
  const batchProgressRow = createStatusTextRow();
  const fileNameRow = createStatusTextRow();
  let totalCount = 0;

  const progressCallback = (request: DownloadRequest): void => {
    totalCount += 1;
    totalProgressRow.textContent = `Downloading: ${totalCount} / ${favoriteCount}`;
    fileNameRow.textContent = `${request.filename}`;
  };

  for (let i = 0; i < batches.length; i += 1) {
    const batch = batches[i];

    batchProgressRow.textContent = `Batch: ${i + 1} / ${batches.length}`;
    totalProgressRow.textContent = `Total ${batch.length} posts`;

    await FavoritesDownloader.startDownloading(batch, progressCallback);
  }
  statusHeader.textContent = `Downloaded ${favoriteCount} Results`;
  finishDownload();
}

function finishDownload(): void {
  clearStatusTextRows();
  createStatusTextRow().textContent = "Finished";
  cancelButton.textContent = "Exit";
}
