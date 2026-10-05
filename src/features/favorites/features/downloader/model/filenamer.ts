import * as DownloaderFilename from "@/features/favorites/features/downloader/model/filename_builder";
import { FilenameCategory, FilenameParts, Filenamer } from "@/features/favorites/features/downloader/types/types";
import { PostMedia } from "@/core/domain/post/post";
import { Preference } from "@/lib/storage/preference";
import { capitalize } from "@/core/utils/string/string";

const CATEGORIES: FilenameCategory[] = ["artist", "character", "copyright"];

export class DownloaderFilenamer implements Filenamer {
  private readonly filenameFormat: Preference<number>;

  constructor({ filenameFormat }: { filenameFormat: Preference<number> }) {
    this.filenameFormat = filenameFormat;
  }

  public filenameFor(item: PostMedia, parts: FilenameParts): string {
    return DownloaderFilename.build(item, parts, this.selectedCategories());
  }

  public options(): Map<number, string> {
    return new Map(CATEGORIES.map((category, index) => [1 << index, capitalize(category)]));
  }

  private selectedCategories(): FilenameCategory[] {
    const selected = this.filenameFormat.value;
    return CATEGORIES.filter((_, index) => (selected & (1 << index)) > 0);
  }
}
