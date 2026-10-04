import { AppContext } from "@/app/context/context";
import { Downloader } from "@/features/favorites/features/downloader/downloader";
import { DownloaderDependencies } from "@/features/favorites/features/downloader/types/types";
import { FavoritesDrawerSectionContent } from "@/types/favorites_ui";
import { Snippets } from "@/features/favorites/features/snippets/snippets";
import { SnippetsDependencies } from "@/features/favorites/features/snippets/types/types";
import { setSnippetSuggestionSource } from "@/lib/ui/autocomplete/autocomplete";

export interface FavoritesFeaturesDependencies {
  downloader: DownloaderDependencies;
  snippets: SnippetsDependencies;
}

export class FavoritesFeatures {
  private readonly context: AppContext;
  private readonly downloader: Downloader;
  private readonly snippets: Snippets;

  constructor(context: AppContext, { downloader, snippets }: FavoritesFeaturesDependencies) {
    this.context = context;
    this.downloader = new Downloader(downloader);
    this.snippets = new Snippets(snippets);
  }

  public setup(): void {
    this.setupDownloader();
    this.setupSnippets();
  }

  public buildDownloaderSection(): FavoritesDrawerSectionContent {
    return this.downloader.buildDrawerSection();
  }

  public buildSnippetsSection(): FavoritesDrawerSectionContent {
    return this.snippets.buildDrawerSection();
  }

  private setupDownloader(): void {
    const { events, milestones, preferences } = this.context;

    milestones.favorites.favoritesLoaded.wait().then(() => this.downloader.enable());
    events.favorites.searchResultsUpdated.on(() => this.downloader.reRender());
    preferences.favorites.downloadBatchSize.on(() => this.downloader.reRender());
    preferences.favorites.downloadFilenameFormat.on(() => this.downloader.reRender());
  }

  private setupSnippets(): void {
    this.snippets.load();
    setSnippetSuggestionSource(prefix => this.snippets.suggestions(prefix));
  }
}
