import { DownloaderContext } from "@/features/favorites/features/downloader/types";
import { MediaItem } from "@/types/media";
import { TagCategory } from "@/types/search";

export const FavoritesDownloaderContext: DownloaderContext = {
  getItems: (): MediaItem[] => [],
  getTagCategory: (): TagCategory | undefined => undefined
};

export function setContext(deps: DownloaderContext): void {
  Object.assign(FavoritesDownloaderContext, deps);
}
