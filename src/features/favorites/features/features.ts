import * as FavoritesDownloader from "@/features/favorites/features/downloader/downloader";
import * as FavoritesSnippets from "@/features/favorites/features/snippets/snippets";
import { DownloaderDependencies } from "@/features/favorites/features/downloader/types";
import { Events } from "@/app/channels/events";
import { Preferences } from "@/app/context/preferences";
import { SnippetsDependencies } from "@/features/favorites/features/snippets/types";
import { setSnippetSuggestionSource } from "@/lib/ui/autocomplete/autocomplete";

interface FavoritesFeaturesDependencies {
  downloader: DownloaderDependencies;
  snippets: SnippetsDependencies;
}

export function setup(dependencies: FavoritesFeaturesDependencies): void {
  setupDownloader(dependencies.downloader);
  setupSnippets(dependencies.snippets);
}

function setupDownloader(dependencies: DownloaderDependencies): void {
  FavoritesDownloader.setup(dependencies);
  Events.favorites.favoritesLoaded.on(FavoritesDownloader.enable, { once: true });
  Events.favorites.searchResultsUpdated.on(FavoritesDownloader.reRender);
  Preferences.favorites.downloadBatchSize.on(FavoritesDownloader.reRender);
  Preferences.favorites.downloadFilenameFormat.on(FavoritesDownloader.reRender);
}

function setupSnippets(deps: SnippetsDependencies): void {
  FavoritesSnippets.setup(deps);
  setSnippetSuggestionSource(FavoritesSnippets.suggestions);
}

export const mountDownloader = FavoritesDownloader.mount;
export const mountSnippets = FavoritesSnippets.mount;
