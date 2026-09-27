import { ProgressBar, buildProgressBar } from "@/lib/ui/widgets/progress_bar";
import { DownloaderAction } from "@/features/favorites/features/downloader/types/types";
import { createElement } from "@/utils/browser/element";

export class DownloaderShell {
  public readonly batchSizeRow: HTMLElement;
  public readonly filenameFormatRow: HTMLElement;
  public readonly progressBar: ProgressBar;
  public readonly status: HTMLElement;
  public readonly downloadButton: HTMLButtonElement;
  public readonly cancelButton: HTMLButtonElement;
  public readonly actions: HTMLElement;

  constructor() {
    this.batchSizeRow = createElement("div", { className: "favorites-download-batch-size" });
    this.filenameFormatRow = createElement("div", { className: "favorites-download-filename-format" });
    this.progressBar = buildProgressBar();
    this.status = createElement("div", { className: "favorites-download-status" });
    this.downloadButton = button("Download Results", "start");
    this.cancelButton = button("Cancel", "cancel");
    this.actions = createElement("div", { className: "favorites-download-actions", children: [this.downloadButton, this.cancelButton] });
    this.status.setAttribute("role", "status");
  }
}

function button(label: string, action: DownloaderAction): HTMLButtonElement {
  const element = createElement("button", { className: "action-button favorites-download-button", textContent: label });

  element.type = "button";
  element.dataset.downloaderAction = action;
  return element;
}
