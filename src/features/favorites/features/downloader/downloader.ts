import * as MediaResolver from "@/lib/media/resolver";
import { DownloaderDependencies } from "@/features/favorites/features/downloader/types";
import { FavoritesArchiver } from "@/features/favorites/features/downloader/archiver";
import { FavoritesBatchDownloader } from "@/features/favorites/features/downloader/download";
import { FavoritesDownloadPanel } from "@/features/favorites/features/downloader/panel";
import { FavoritesDownloadSession } from "@/features/favorites/features/downloader/session";
import { FavoritesDrawerViewContent } from "@/types/favorite";
import { FavoritesFilenameSettings } from "@/features/favorites/features/downloader/filename_settings";
import { downloadBlob } from "@/utils/browser/download";

export class FavoritesDownloader {
  private readonly panel: FavoritesDownloadPanel;
  private readonly session: FavoritesDownloadSession;

  constructor({ batchSize, filenameFormat, getSearchResults, getTagCategory, getTagsForIds }: DownloaderDependencies) {
    const filenamer = new FavoritesFilenameSettings({ filenameFormat, getTagCategory });
    const archiver = new FavoritesArchiver({
      filenamer,
      getTagsForIds,
      resolveExtension: MediaResolver.resolveExtension,
      resolveMediaUrl: MediaResolver.resolveMediaUrl,
      fetch: (url, init): Promise<Response> => fetch(url, init)
    });
    const batchDownloader = new FavoritesBatchDownloader({ archiver, saveBlob: downloadBlob });

    this.panel = new FavoritesDownloadPanel({
      batchSize,
      filenameFormat,
      filenameOptions: filenamer.options(),
      onDownload: (): Promise<void> => this.session.start(),
      onCancel: (): void => this.session.cancel()
    });
    this.session = new FavoritesDownloadSession({ panel: this.panel, batchDownloader, batchSize, getSearchResults });
  }

  public mount(): FavoritesDrawerViewContent {
    return { mount: panel => this.panel.mount(panel) };
  }

  public enable(): void {
    this.session.enable();
  }

  public reRender(): void {
    this.session.reRender();
  }
}
