import { DownloaderCallbacks } from "@/features/favorites/features/downloader/types";
import { MediaItem } from "@/types/media";
import { TagCategory } from "@/types/search";

export const FavoritesDownloaderDeps: DownloaderCallbacks = {
  getItems: (): MediaItem[] => [],
  getTagCategory: (): TagCategory | undefined => undefined
};

export function setDeps(deps: DownloaderCallbacks): void {
  Object.assign(FavoritesDownloaderDeps, deps);
}
