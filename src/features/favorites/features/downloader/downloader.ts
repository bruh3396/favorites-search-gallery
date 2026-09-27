import * as MediaResolver from "@/lib/media/resolver";
import { DownloaderContext, DownloaderDependencies } from "@/features/favorites/features/downloader/types/types";
import { DownloaderControl } from "@/features/favorites/features/downloader/control/control";
import { DownloaderFlows } from "@/features/favorites/features/downloader/flows/flows";
import { DownloaderModel } from "@/features/favorites/features/downloader/model/model";
import { DownloaderShell } from "@/features/favorites/features/downloader/shell/shell";
import { DownloaderView } from "@/features/favorites/features/downloader/view/view";
import { FavoritesDrawerSectionContent } from "@/types/favorites_ui";
import { downloadBlob } from "@/utils/browser/download";

export class Downloader {
  private readonly flows: DownloaderFlows;
  private readonly control: DownloaderControl;

  constructor(dependencies: DownloaderDependencies) {
    const context: DownloaderContext = {
      ...dependencies,
      resolveExtension: MediaResolver.resolveExtension,
      resolveMediaUrl: MediaResolver.resolveMediaUrl,
      fetch: (url, init): Promise<Response> => fetch(url, init),
      saveBlob: downloadBlob
    };
    const shell = new DownloaderShell();
    const model = new DownloaderModel(context);

    this.flows = new DownloaderFlows(context, model, new DownloaderView(shell));
    this.control = new DownloaderControl(shell, this.flows.session, {
      batchSize: dependencies.batchSize,
      filenameFormat: dependencies.filenameFormat,
      filenameOptions: model.filenameOptions()
    });
  }

  public buildDrawerSection(): FavoritesDrawerSectionContent {
    return { mount: (container): void => this.flows.session.mount(container) };
  }

  public enable(): void {
    this.flows.session.enable();
  }

  public reRender(): void {
    this.flows.session.reRender();
  }
}
