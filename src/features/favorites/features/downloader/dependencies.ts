import { DownloaderDependencies } from "@/features/favorites/features/downloader/types";
import { MediaItem } from "@/types/media";
import { Preference } from "@/lib/storage/preference";
import { TagCategory } from "@/types/search";

export const FavoritesDownloaderDependencies: DownloaderDependencies = {
  batchSize: new Preference<number>("", 0),
  filenameFormat: new Preference<number>("", 0),
  getSearchResults: (): MediaItem[] => [],
  getTagCategory: (): TagCategory | undefined => undefined,
  getTagsForIds: (): Promise<Map<string, Set<string>>> => Promise.resolve(new Map())
};

export function setDependencies(dependencies: DownloaderDependencies): void {
  Object.assign(FavoritesDownloaderDependencies, dependencies);
}
