import { DownloaderFlow, DownloaderFlowDependencies } from "@/features/favorites/features/downloader/flows/flow";
import { DownloaderIntents, DownloaderPhase, DownloaderProgress } from "@/features/favorites/features/downloader/types/types";

export class DownloaderSessionFlow extends DownloaderFlow implements DownloaderIntents {
  private abortController: AbortController | null;
  private ready: boolean;

  constructor(dependencies: DownloaderFlowDependencies) {
    super(dependencies);
    this.abortController = null;
    this.ready = false;
  }

  public mount(container: HTMLElement): void {
    this.view.mount(container);
  }

  public enable(): void {
    this.ready = true;
    this.view.showStatus("");
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
    const items = this.context.getSearchResults();

    if (items.length === 0) {
      this.view.showStatus("No search results to download");
      return;
    }
    const controller = new AbortController();

    this.abortController = controller;
    this.view.showProgress(0, items.length, "");
    this.render();
    this.view.showStatus(`Downloading ${items.length}...`);

    try {
      const result = await this.model.download(items, this.context.batchSize.value, controller.signal, progress => this.showProgress(progress));

      this.view.showStatus(this.model.summarize(result));
    } finally {
      this.abortController = null;
      this.render();
    }
  }

  private isDownloading(): boolean {
    return this.abortController !== null;
  }

  private phase(): DownloaderPhase {
    if (!this.ready) {
      return "waiting";
    }
    return this.isDownloading() ? "downloading" : "idle";
  }

  private render(): void {
    const itemCount = this.ready ? this.context.getSearchResults().length : 0;

    this.view.render({ phase: this.phase(), label: this.model.downloadLabel(itemCount, this.context.batchSize.value), enabled: itemCount > 0 });
  }

  private showProgress(progress: DownloaderProgress): void {
    this.view.showProgress(progress.successCount + progress.failureCount, progress.totalItems, progress.filename);
    this.view.showStatus(this.model.describeProgress(progress));
  }
}
