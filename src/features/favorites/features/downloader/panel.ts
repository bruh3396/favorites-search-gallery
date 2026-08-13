import * as FavoritesDownload from "@/features/favorites/features/downloader/download";
import { DownloadProgress, DownloadResult } from "@/features/favorites/features/downloader/types";
import { multiSegmented, segmented } from "@/lib/ui/settings/controls";
import { DownloaderConfig } from "@/config/downloader_config";
import { FavoritesDownloaderDeps } from "@/features/favorites/features/downloader/deps";
import { FavoritesDrawerViewContent } from "@/types/favorite";
import { Preferences } from "@/app/context/preferences";
import { SettingsClass } from "@/lib/ui/settings/classes";
import { buildProgressBar } from "@/lib/ui/widgets/progress_bar";
import { categoryOptions } from "@/features/favorites/features/downloader/filename_settings";
import { createElement } from "@/utils/dom/element_factory";
import { pluralize } from "@/utils/string/format";
import { toggleDataset } from "@/utils/dom/dataset";

let abortController: AbortController | null = null;
let ready = false;
const batchSizeRow = createElement("div", { className: "favorites-download-batch-size" });
const filenameFormatRow = createElement("div", { className: "favorites-download-filename-format" });
const downloadButton = createElement("button", { className: "action-button favorites-download-button", textContent: "Download Results" });
const cancelButton = createElement("button", { className: "action-button favorites-download-button", textContent: "Cancel" });
const progressBar = buildProgressBar();
const status = createElement("div", { className: "favorites-download-status", textContent: "Waiting for favorites to load" });

downloadButton.type = "button";
cancelButton.type = "button";
downloadButton.onclick = startDownload;
cancelButton.onclick = cancel;

export function mount(): FavoritesDrawerViewContent {
  return { mount: buildPanel };
}

export function enable(): void {
  ready = true;

  if (!isDownloading()) {
    status.textContent = "";
  }
  render();
}

export function reRender(): void {
  if (!isDownloading()) {
    render();
  }
}

function buildPanel(panel: HTMLElement): void {
  const actions = createElement("div", { className: "favorites-download-actions", children: [downloadButton, cancelButton] });

  batchSizeRow.append(buildBatchSizeControl());
  filenameFormatRow.append(buildFilenameFormatControl());
  panel.classList.add(SettingsClass.view, "favorites-download-panel");
  panel.append(batchSizeRow, filenameFormatRow, progressBar.element, status, actions);
  render();
}

function isDownloading(): boolean {
  return abortController !== null;
}

function render(): void {
  const downloading = isDownloading();
  const itemCount = ready ? FavoritesDownloaderDeps.getSearchResults().length : 0;

  toggleDataset(batchSizeRow, "hidden", !ready || downloading);
  toggleDataset(filenameFormatRow, "hidden", !ready || downloading);
  toggleDataset(downloadButton, "hidden", !ready || downloading);
  toggleDataset(cancelButton, "hidden", !ready || !downloading);
  progressBar.setVisible(ready && downloading);
  downloadButton.disabled = itemCount === 0;
  downloadButton.textContent = buildDownloadLabel(itemCount);
}

function buildDownloadLabel(itemCount: number): string {
  if (itemCount === 0) {
    return "Download Results";
  }
  const batchCount = countBatches(itemCount, Preferences.favorites.downloadBatchSize.value);

  if (batchCount <= 1) {
    return `Download ${itemCount} Result${pluralize(itemCount)}`;
  }
  return `Download ${itemCount} Results · ${batchCount} zips`;
}

function countBatches(itemCount: number, batchSize: number): number {
  return batchSize <= 0 ? 1 : Math.ceil(itemCount / batchSize);
}

function buildFilenameFormatControl(): HTMLElement {
  return multiSegmented<number>({
    id: "download-filename-format",
    label: "Filename",
    tooltip: "Add selected meta tags to each filename",
    tooltipPosition: "below",
    preference: Preferences.favorites.downloadFilenameFormat,
    options: categoryOptions()
  })();
}

function buildBatchSizeControl(): HTMLElement {
  return segmented<number>({
    id: "download-batch-size",
    label: "Batch Size",
    tooltip: "Split download into smaller chunks",
    tooltipPosition: "below",
    preference: Preferences.favorites.downloadBatchSize,
    options: new Map(DownloaderConfig.batchSizeOptions.map(size => [size, size === 0 ? "All" : String(size)]))
  })();
}

function cancel(): void {
  abortController?.abort();
}

async function startDownload(): Promise<void> {
  if (!ready || isDownloading()) {
    return;
  }
  const items = FavoritesDownloaderDeps.getSearchResults();

  if (items.length === 0) {
    status.textContent = "No search results to download";
    return;
  }
  const controller = new AbortController();

  abortController = controller;
  progressBar.setProgress(0, items.length);
  progressBar.setLabel("");
  render();
  status.textContent = `Downloading ${items.length}...`;

  try {
    const result = await FavoritesDownload.download(items, Preferences.favorites.downloadBatchSize.value, controller.signal, showProgress);

    status.textContent = summarize(result);
  } finally {
    if (abortController === controller) {
      abortController = null;
    }
    render();
  }
}

function showProgress(progress: DownloadProgress): void {
  const counts = `${progress.successCount}/${progress.totalItems}${failureClause(progress.failureCount)}`;

  progressBar.setProgress(progress.successCount + progress.failureCount, progress.totalItems);
  progressBar.setLabel(progress.filename);

  status.textContent = progress.totalBatches > 1 ? `Batch ${progress.currentBatch}/${progress.totalBatches} - ${counts}` : counts;
}

function summarize(result: DownloadResult): string {
  const verb = result.aborted ? "Cancelled" : "Done";
  return `${verb}: ${result.successCount} downloaded${failureClause(result.failureCount)}`;
}

function failureClause(failureCount: number): string {
  return failureCount === 0 ? "" : ` (${failureCount} failed)`;
}
