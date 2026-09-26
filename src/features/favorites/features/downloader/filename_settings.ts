import { FilenameCategory, Filenamer } from "@/features/favorites/features/downloader/types";
import { MediaItem } from "@/types/media";
import { Preference } from "@/lib/storage/preference";
import { TagCategory } from "@/types/search";
import { buildFilename } from "@/features/favorites/features/downloader/filename_builder";
import { capitalize } from "@/utils/pure/string";

const CATEGORIES: FilenameCategory[] = ["artist", "character", "copyright"];

export class FavoritesFilenameSettings implements Filenamer {
  private readonly filenameFormat: Preference<number>;
  private readonly getTagCategory: (tagName: string) => TagCategory | undefined;

  constructor({ filenameFormat, getTagCategory }: { filenameFormat: Preference<number>; getTagCategory: (tagName: string) => TagCategory | undefined }) {
    this.filenameFormat = filenameFormat;
    this.getTagCategory = getTagCategory;
  }

  public filenameFor(item: MediaItem, tags: Set<string>, extension: string): string {
    return buildFilename(item, tags, extension, this.selectedCategories(), this.getTagCategory);
  }

  public options(): Map<number, string> {
    return new Map(CATEGORIES.map((category, index) => [1 << index, capitalize(category)]));
  }

  private selectedCategories(): FilenameCategory[] {
    const selected = this.filenameFormat.value;
    return CATEGORIES.filter((_, index) => (selected & (1 << index)) > 0);
  }
}
