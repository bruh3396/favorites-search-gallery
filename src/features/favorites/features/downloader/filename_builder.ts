import { DownloaderConfig } from "@/config/downloader_config";
import { FilenameCategory } from "@/features/favorites/features/downloader/types";
import { MediaItem } from "@/types/media";
import { TagCategory } from "@/types/search";

const STRIPPED_CHARACTERS = /[<>:"/\\|?*' -]/g;
const TRAILING_QUALIFIER = /_\([^)]*\)$/;

export function buildFilename(item: MediaItem, extension: string, categories: FilenameCategory[], getTagCategory: (tagName: string) => TagCategory | undefined): string {
  const segments: string[] = categories
    .map(category => buildCategorySegment(item, category, getTagCategory))
    .filter(segment => segment !== "");

  const suffix = segments.length === 0 ? item.id : `${DownloaderConfig.filename.categorySeparator}${item.id}`;
  const name = capLength(segments.join(DownloaderConfig.filename.categorySeparator), suffix);
  return `${name}${suffix}.${extension}`;
}

function buildCategorySegment(item: MediaItem, category: FilenameCategory, getTagCategory: (tagName: string) => TagCategory | undefined): string {
  const tagsInCategory = Array.from(item.tags)
    .filter(tag => getTagCategory(tag) === category)
    .sort();
  return dropQualifiedDuplicates(tagsInCategory)
    .map(sanitizeForFilename)
    .filter(tag => tag !== "")
    .join(DownloaderConfig.filename.tagSeparator);
}

function dropQualifiedDuplicates(tags: string[]): string[] {
  const bases = new Set(tags.filter(tag => !TRAILING_QUALIFIER.test(tag)));
  return tags.filter(tag => !TRAILING_QUALIFIER.test(tag) || !bases.has(tag.replace(TRAILING_QUALIFIER, "")));
}

function sanitizeForFilename(tag: string): string {
  return tag
    .replace(STRIPPED_CHARACTERS, "")
    .replace(/\s+/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^[_.]+|[_.]+$/g, "");
}

function capLength(name: string, suffix: string): string {
  if (name.length + suffix.length <= DownloaderConfig.filename.maxLength) {
    return name;
  }
  const truncatedName = name.slice(0, Math.max(0, DownloaderConfig.filename.maxLength - suffix.length));
  return truncatedName.replace(/[^a-z0-9]+$/i, "");
}
