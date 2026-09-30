import * as DownloaderFilename from "@/features/favorites/features/downloader/model/filename_builder";
import { FilenameCategory, Filenamer } from "@/features/favorites/features/downloader/types/types";
import { PostMedia } from "@/core/domain/post/post";
import { Preference } from "@/lib/storage/preference";
import { TagCategoryMap } from "@/core/domain/tag/tag";
import { capitalize } from "@/utils/pure/string";

const CATEGORIES: FilenameCategory[] = ["artist", "character", "copyright"];

export class DownloaderFilenamer implements Filenamer {
  private readonly filenameFormat: Preference<number>;

  constructor({ filenameFormat }: { filenameFormat: Preference<number> }) {
    this.filenameFormat = filenameFormat;
  }

  public filenameFor(item: PostMedia, tags: Set<string>, extension: string, tagCategories: TagCategoryMap): string {
    return DownloaderFilename.build(item, tags, extension, this.selectedCategories(), tagCategories);
  }

  public options(): Map<number, string> {
    return new Map(CATEGORIES.map((category, index) => [1 << index, capitalize(category)]));
  }

  private selectedCategories(): FilenameCategory[] {
    const selected = this.filenameFormat.value;
    return CATEGORIES.filter((_, index) => (selected & (1 << index)) > 0);
  }
}
