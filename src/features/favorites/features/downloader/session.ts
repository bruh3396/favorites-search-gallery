import { BatchDownloader, DownloadPanel, DownloadPhase, DownloadProgress, DownloadResult } from "@/features/favorites/features/downloader/types";
import { MediaItem } from "@/types/media";
import { Preference } from "@/lib/storage/preference";
import { pluralSuffix } from "@/utils/pure/string";

interface SessionDependencies {
  panel: DownloadPanel;
  batchDownloader: BatchDownloader;
  batchSize: Preference<number>;
  getSearchResults: () => MediaItem[];
}

export class FavoritesDownloadSession {
  private readonly panel: DownloadPanel;
  private readonly batchDownloader: BatchDownloader;
  private readonly batchSize: Preference<number>;
  private readonly getSearchResults: () => MediaItem[];
  private abortController: AbortController | null;
  private ready: boolean;

  constructor({ panel, batchDownloader, batchSize, getSearchResults }: SessionDependencies) {
    this.panel = panel;
    this.batchDownloader = batchDownloader;
    this.batchSize = batchSize;
    this.getSearchResults = getSearchResults;
    this.abortController = null;
    this.ready = false;
  }

  public enable(): void {
    this.ready = true;
    this.panel.showStatus("");
    this.render();
  }

  public reRender(): void {
    if (!this.isDownloading()) {
      this.render();
    }
  }

  public cancel(): void {
    this.abortController?.abort();
  }

  public async start(): Promise<void> {
    if (!this.ready || this.isDownloading()) {
      return;
    }
    const items = this.getSearchResults();

    if (items.length === 0) {
      this.panel.showStatus("No search results to download");
      return;
    }
    const controller = new AbortController();

    this.abortController = controller;
    this.panel.showProgress(0, items.length, "");
    this.render();
    this.panel.showStatus(`Downloading ${items.length}...`);

    try {
      const result = await this.batchDownloader.download(items, this.batchSize.value, controller.signal, progress => this.showProgress(progress));

      this.panel.showStatus(summarize(result));
    } finally {
      this.abortController = null;
      this.render();
    }
  }

  private isDownloading(): boolean {
    return this.abortController !== null;
  }

  private phase(): DownloadPhase {
    if (!this.ready) {
      return "waiting";
    }
    return this.isDownloading() ? "downloading" : "idle";
  }

  private render(): void {
    const itemCount = this.ready ? this.getSearchResults().length : 0;

    this.panel.render(this.phase(), downloadLabel(itemCount, this.batchSize.value), itemCount > 0);
  }

  private showProgress(progress: DownloadProgress): void {
    const counts = `${progress.successCount}/${progress.totalItems}${failureClause(progress.failureCount)}`;

    this.panel.showProgress(progress.successCount + progress.failureCount, progress.totalItems, progress.filename);
    this.panel.showStatus(progress.totalBatches > 1 ? `Batch ${progress.currentBatch}/${progress.totalBatches} - ${counts}` : counts);
  }
}

function downloadLabel(itemCount: number, batchSize: number): string {
  if (itemCount === 0) {
    return "Download Results";
  }
  const batchCount = batchSize <= 0 ? 1 : Math.ceil(itemCount / batchSize);

  if (batchCount <= 1) {
    return `Download ${itemCount} Result${pluralSuffix(itemCount)}`;
  }
  return `Download ${itemCount} Results · ${batchCount} zips`;
}

function summarize(result: DownloadResult): string {
  const verb = result.aborted ? "Cancelled" : "Done";
  return `${verb}: ${result.successCount} downloaded${failureClause(result.failureCount)}`;
}

function failureClause(failureCount: number): string {
  return failureCount === 0 ? "" : ` (${failureCount} failed)`;
}
