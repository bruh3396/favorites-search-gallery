import { DownloaderContext } from "@/features/favorites/features/downloader/types/types";
import { DownloaderFlows } from "@/features/favorites/features/downloader/flows/flows";
import { DownloaderModel } from "@/features/favorites/features/downloader/model/model";
import { DownloaderView } from "@/features/favorites/features/downloader/view/view";

export interface DownloaderFlowDependencies {
  context: DownloaderContext;
  model: DownloaderModel;
  view: DownloaderView;
  flows: DownloaderFlows;
}

export abstract class DownloaderFlow {
  protected readonly context: DownloaderContext;
  protected readonly model: DownloaderModel;
  protected readonly view: DownloaderView;
  protected readonly flows: DownloaderFlows;

  constructor(dependencies: DownloaderFlowDependencies) {
    this.context = dependencies.context;
    this.model = dependencies.model;
    this.view = dependencies.view;
    this.flows = dependencies.flows;
  }
}
