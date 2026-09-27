import { DownloaderScene } from "@/features/favorites/features/downloader/types/types";
import { DownloaderShell } from "@/features/favorites/features/downloader/shell/shell";
import { SettingsClass } from "@/lib/ui/settings/classes";
import { toggleDataset } from "@/utils/browser/dataset";

export class DownloaderView {
  private readonly shell: DownloaderShell;

  constructor(shell: DownloaderShell) {
    this.shell = shell;
    this.showStatus("Waiting for favorites to load");
    this.render({ phase: "waiting", label: "Download Results", enabled: false });
  }

  public mount(container: HTMLElement): void {
    const { batchSizeRow, filenameFormatRow, progressBar, status, actions } = this.shell;

    container.classList.add(SettingsClass.view, "favorites-download-section");
    container.append(batchSizeRow, filenameFormatRow, progressBar.element, status, actions);
  }

  public render({ phase, label, enabled }: DownloaderScene): void {
    const { batchSizeRow, filenameFormatRow, downloadButton, cancelButton, progressBar } = this.shell;

    toggleDataset(batchSizeRow, "hidden", phase !== "idle");
    toggleDataset(filenameFormatRow, "hidden", phase !== "idle");
    toggleDataset(downloadButton, "hidden", phase !== "idle");
    toggleDataset(cancelButton, "hidden", phase !== "downloading");
    progressBar.setVisible(phase === "downloading");
    downloadButton.disabled = !enabled;
    downloadButton.textContent = label;
  }

  public showStatus(text: string): void {
    this.shell.status.textContent = text;
  }

  public showProgress(completed: number, total: number, label: string): void {
    this.shell.progressBar.setProgress(completed, total);
    this.shell.progressBar.setLabel(label);
  }
}
