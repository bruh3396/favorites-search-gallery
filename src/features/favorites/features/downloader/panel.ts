import { DownloadPanel, DownloadPhase } from "@/features/favorites/features/downloader/types";
import { ProgressBar, buildProgressBar } from "@/lib/ui/widgets/progress_bar";
import { multiSegmented, segmented } from "@/lib/ui/settings/controls";
import { DownloaderConfig } from "@/config/downloader_config";
import { Preference } from "@/lib/storage/preference";
import { SettingsClass } from "@/lib/ui/settings/classes";
import { createElement } from "@/utils/browser/element";
import { toggleDataset } from "@/utils/browser/dataset";

interface PanelDependencies {
  batchSize: Preference<number>;
  filenameFormat: Preference<number>;
  filenameOptions: Map<number, string>;
  onDownload: () => void;
  onCancel: () => void;
}

export class FavoritesDownloadPanel implements DownloadPanel {
  private readonly batchSizeRow: HTMLElement;
  private readonly filenameFormatRow: HTMLElement;
  private readonly downloadButton: HTMLButtonElement;
  private readonly cancelButton: HTMLButtonElement;
  private readonly progressBar: ProgressBar;
  private readonly status: HTMLElement;

  constructor({ batchSize, filenameFormat, filenameOptions, onDownload, onCancel }: PanelDependencies) {
    this.batchSizeRow = createElement("div", { className: "favorites-download-batch-size", children: [buildBatchSizeControl(batchSize)] });
    this.filenameFormatRow = createElement("div", { className: "favorites-download-filename-format", children: [buildFilenameFormatControl(filenameFormat, filenameOptions)] });
    this.downloadButton = createElement("button", { className: "action-button favorites-download-button", textContent: "Download Results" });
    this.cancelButton = createElement("button", { className: "action-button favorites-download-button", textContent: "Cancel" });
    this.progressBar = buildProgressBar();
    this.status = createElement("div", { className: "favorites-download-status", textContent: "Waiting for favorites to load" });
    this.downloadButton.type = "button";
    this.cancelButton.type = "button";
    this.downloadButton.onclick = onDownload;
    this.cancelButton.onclick = onCancel;
    this.render("waiting", "Download Results", false);
  }

  public mount(panel: HTMLElement): void {
    const actions = createElement("div", { className: "favorites-download-actions", children: [this.downloadButton, this.cancelButton] });

    panel.classList.add(SettingsClass.view, "favorites-download-panel");
    panel.append(this.batchSizeRow, this.filenameFormatRow, this.progressBar.element, this.status, actions);
  }

  public render(phase: DownloadPhase, downloadLabel: string, downloadEnabled: boolean): void {
    toggleDataset(this.batchSizeRow, "hidden", phase !== "idle");
    toggleDataset(this.filenameFormatRow, "hidden", phase !== "idle");
    toggleDataset(this.downloadButton, "hidden", phase !== "idle");
    toggleDataset(this.cancelButton, "hidden", phase !== "downloading");
    this.progressBar.setVisible(phase === "downloading");
    this.downloadButton.disabled = !downloadEnabled;
    this.downloadButton.textContent = downloadLabel;
  }

  public showStatus(text: string): void {
    this.status.textContent = text;
  }

  public showProgress(completed: number, total: number, label: string): void {
    this.progressBar.setProgress(completed, total);
    this.progressBar.setLabel(label);
  }
}

function buildFilenameFormatControl(filenameFormat: Preference<number>, options: Map<number, string>): HTMLElement {
  return multiSegmented<number>({
    id: "download-filename-format",
    label: "Filename",
    tooltip: "Add selected meta tags to each filename",
    tooltipPosition: "below",
    preference: filenameFormat,
    options
  })();
}

function buildBatchSizeControl(batchSize: Preference<number>): HTMLElement {
  return segmented<number>({
    id: "download-batch-size",
    label: "Batch Size",
    tooltip: "Split download into smaller chunks",
    tooltipPosition: "below",
    preference: batchSize,
    options: new Map(DownloaderConfig.batchSizeOptions.map(size => [size, size === 0 ? "All" : String(size)]))
  })();
}
