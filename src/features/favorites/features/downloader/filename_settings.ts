import { FavoritesDownloaderContext } from "@/features/favorites/features/downloader/deps";
import { FilenameCategory } from "@/features/favorites/features/downloader/types";
import { MediaItem } from "@/types/media";
import { Preferences } from "@/app/context/preferences";
import { buildFilename } from "@/features/favorites/features/downloader/filename_builder";
import { capitalize } from "@/utils/string/format";

const CATEGORIES: FilenameCategory[] = ["artist", "character", "copyright"];

export function filenameFor(item: MediaItem, extension: string): string {
  return buildFilename(item, extension, selectedCategories(), FavoritesDownloaderContext.getTagCategory);
}

export function categoryOptions(): Map<number, string> {
  return new Map(CATEGORIES.map((category, index) => [1 << index, capitalize(category)]));
}

function selectedCategories(): FilenameCategory[] {
  const selected = Preferences.favorites.downloadFilenameFormat.value;
  return CATEGORIES.filter((category, index) => (selected & (1 << index)) > 0);
}
