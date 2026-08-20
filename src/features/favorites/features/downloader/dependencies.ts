import { DownloaderDependencies } from "@/features/favorites/features/downloader/types";
import { MediaItem } from "@/types/media";
import { TagCategory } from "@/types/search";

export const FavoritesDownloaderDependencies: DownloaderDependencies = {
  getSearchResults: (): MediaItem[] => [],
  getTagCategory: (): TagCategory | undefined => undefined
};

export function setDependencies(dependencies: DownloaderDependencies): void {
  Object.assign(FavoritesDownloaderDependencies, dependencies);
}
