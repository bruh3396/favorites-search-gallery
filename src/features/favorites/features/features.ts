import * as FavoritesDownloader from "@/features/favorites/features/downloader/downloader";
import * as FavoritesSnippets from "@/features/favorites/features/snippets/snippets";
import { AppContext } from "@/app/context/context";
import { DownloaderDependencies } from "@/features/favorites/features/downloader/types";
import { FavoritesDrawerViewContent } from "@/types/favorite";
import { SnippetsDependencies } from "@/features/favorites/features/snippets/types";
import { setSnippetSuggestionSource } from "@/lib/ui/autocomplete/autocomplete";

interface FavoritesFeaturesDependencies {
  downloader: DownloaderDependencies;
  snippets: SnippetsDependencies;
}

export class FavoritesFeatures {
  constructor(private readonly context: AppContext) {}

  public setup(dependencies: FavoritesFeaturesDependencies): void {
    this.setupDownloader(dependencies.downloader);
    this.setupSnippets(dependencies.snippets);
  }

  public mountDownloader(): FavoritesDrawerViewContent {
    return FavoritesDownloader.mount();
  }

  public mountSnippets(): FavoritesDrawerViewContent {
    return FavoritesSnippets.mount();
  }

  private setupDownloader(dependencies: DownloaderDependencies): void {
    const { events, preferences } = this.context;

    FavoritesDownloader.setup(dependencies);
    events.favorites.favoritesLoaded.on(FavoritesDownloader.enable, { once: true });
    events.favorites.searchResultsUpdated.on(FavoritesDownloader.reRender);
    preferences.favorites.downloadBatchSize.on(FavoritesDownloader.reRender);
    preferences.favorites.downloadFilenameFormat.on(FavoritesDownloader.reRender);
  }

  private setupSnippets(dependencies: SnippetsDependencies): void {
    FavoritesSnippets.setup(dependencies);
    setSnippetSuggestionSource(FavoritesSnippets.suggestions);
  }
}
