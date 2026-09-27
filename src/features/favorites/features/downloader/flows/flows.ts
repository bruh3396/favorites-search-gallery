import { DownloaderContext } from "@/features/favorites/features/downloader/types/types";
import { DownloaderFlowDependencies } from "@/features/favorites/features/downloader/flows/flow";
import { DownloaderModel } from "@/features/favorites/features/downloader/model/model";
import { DownloaderSessionFlow } from "@/features/favorites/features/downloader/flows/session";
import { DownloaderView } from "@/features/favorites/features/downloader/view/view";

export class DownloaderFlows {
  public readonly session: DownloaderSessionFlow;

  constructor(context: DownloaderContext, model: DownloaderModel, view: DownloaderView) {
    const dependencies: DownloaderFlowDependencies = { context, model, view, flows: this };

    this.session = new DownloaderSessionFlow(dependencies);
  }
}
