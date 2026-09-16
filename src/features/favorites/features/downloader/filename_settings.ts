import { FavoritesDownloaderDependencies } from "@/features/favorites/features/downloader/dependencies";
import { FilenameCategory } from "@/features/favorites/features/downloader/types";
import { MediaItem } from "@/types/media";
import { buildFilename } from "@/features/favorites/features/downloader/filename_builder";
import { capitalize } from "@/utils/pure/string";

const CATEGORIES: FilenameCategory[] = ["artist", "character", "copyright"];

export function filenameFor(item: MediaItem, tags: Set<string>, extension: string): string {
  return buildFilename(item, tags, extension, selectedCategories(), FavoritesDownloaderDependencies.getTagCategory);
}

export function categoryOptions(): Map<number, string> {
  return new Map(CATEGORIES.map((category, index) => [1 << index, capitalize(category)]));
}

function selectedCategories(): FilenameCategory[] {
  const selected = FavoritesDownloaderDependencies.filenameFormat.value;
  return CATEGORIES.filter((category, index) => (selected & (1 << index)) > 0);
}
