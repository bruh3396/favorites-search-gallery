import * as FavoritesSnippets from "@/features/favorites/features/snippets/snippets";
import { AppContext } from "@/app/context/context";
import { DownloaderDependencies } from "@/features/favorites/features/downloader/types";
import { FavoritesDownloader } from "@/features/favorites/features/downloader/downloader";
import { FavoritesDrawerViewContent } from "@/types/favorite";
import { SnippetsDependencies } from "@/features/favorites/features/snippets/types";
import { setSnippetSuggestionSource } from "@/lib/ui/autocomplete/autocomplete";

export interface FavoritesFeaturesDependencies {
  downloader: DownloaderDependencies;
  snippets: SnippetsDependencies;
}

export class FavoritesFeatures {
  private readonly context: AppContext;
  private readonly downloader: FavoritesDownloader;
  private readonly snippets: SnippetsDependencies;

  constructor(context: AppContext, { downloader, snippets }: FavoritesFeaturesDependencies) {
    this.context = context;
    this.downloader = new FavoritesDownloader(downloader);
    this.snippets = snippets;
  }

  public setup(): void {
    this.setupDownloader();
    this.setupSnippets();
  }

  public mountDownloader(): FavoritesDrawerViewContent {
    return this.downloader.mount();
  }

  public mountSnippets(): FavoritesDrawerViewContent {
    return FavoritesSnippets.mount();
  }

  private setupDownloader(): void {
    const { events, preferences } = this.context;

    events.favorites.favoritesLoaded.on(() => this.downloader.enable(), { once: true });
    events.favorites.searchResultsUpdated.on(() => this.downloader.reRender());
    preferences.favorites.downloadBatchSize.on(() => this.downloader.reRender());
    preferences.favorites.downloadFilenameFormat.on(() => this.downloader.reRender());
  }

  private setupSnippets(): void {
    FavoritesSnippets.setup(this.snippets);
    setSnippetSuggestionSource(FavoritesSnippets.suggestions);
  }
}
