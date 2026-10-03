import { DownloaderAction, DownloaderIntents } from "@/features/favorites/features/downloader/types/types";
import { multiSegmented, segmented } from "@/lib/ui/settings/controls";
import { DownloaderConfig } from "@/config/downloader_config";
import { DownloaderShell } from "@/features/favorites/features/downloader/shell/shell";
import { Preference } from "@/lib/storage/preference";

export interface DownloaderControlConfiguration {
  filenameOptions: Map<number, string>;
}

export interface DownloaderControlDependencies {
  shell: DownloaderShell;
  intents: DownloaderIntents;
  batchSize: Preference<number>;
  filenameFormat: Preference<number>;
}

export class DownloaderControl {
  private readonly dispatch: Record<DownloaderAction, () => void>;

  constructor(
    { filenameOptions }: DownloaderControlConfiguration,
    { shell, intents, batchSize, filenameFormat }: DownloaderControlDependencies
  ) {
    this.dispatch = {
      start: (): void => intents.start(),
      cancel: (): void => intents.cancel()
    };
    shell.batchSizeRow.append(batchSizeControl(batchSize));
    shell.filenameFormatRow.append(filenameFormatControl(filenameFormat, filenameOptions));
    shell.actions.addEventListener("click", (event) => this.onClick(event));
  }

  private onClick(event: MouseEvent): void {
    const target = (event.target as Element).closest<HTMLElement>("[data-downloader-action]");

    if (target !== null) {
      this.dispatch[target.dataset.downloaderAction as DownloaderAction]();
    }
  }
}

function filenameFormatControl(filenameFormat: Preference<number>, options: Map<number, string>): HTMLElement {
  return multiSegmented<number>({
    id: "download-filename-format",
    label: "Filename",
    tooltip: "Add selected meta tags to each filename",
    tooltipPosition: "below",
    preference: filenameFormat,
    options
  })();
}

function batchSizeControl(batchSize: Preference<number>): HTMLElement {
  return segmented<number>({
    id: "download-batch-size",
    label: "Batch Size",
    tooltip: "Split download into smaller chunks",
    tooltipPosition: "below",
    preference: batchSize,
    options: new Map(DownloaderConfig.batchSizeOptions.map(size => [size, size === 0 ? "All" : String(size)]))
  })();
}
