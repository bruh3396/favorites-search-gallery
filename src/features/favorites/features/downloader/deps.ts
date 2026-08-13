import { DownloaderDependencies } from "@/features/favorites/features/downloader/types";
import { MediaItem } from "@/types/media";
import { TagCategory } from "@/types/search";

export const FavoritesDownloaderDeps: DownloaderDependencies = {
  getSearchResults: (): MediaItem[] => [],
  getTagCategory: (): TagCategory | undefined => undefined
};

export function setDependencies(deps: DownloaderDependencies): void {
  Object.assign(FavoritesDownloaderDeps, deps);
}
