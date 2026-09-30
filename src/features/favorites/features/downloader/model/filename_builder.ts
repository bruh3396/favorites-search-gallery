import { DownloaderConfig } from "@/config/downloader_config";
import { FilenameCategory } from "@/features/favorites/features/downloader/types/types";
import { PostMedia } from "@/core/domain/post/post";
import { TagCategoryMap } from "@/core/domain/tag/tag";

const STRIPPED_CHARACTERS = /[<>:"/\\|?*' -]/g;
const TRAILING_QUALIFIER = /_\([^)]*\)$/;

export function build(item: PostMedia, tags: Set<string>, extension: string, categories: FilenameCategory[], tagCategories: TagCategoryMap): string {
  const segments: string[] = categories
    .map(category => buildCategorySegment(tags, category, tagCategories))
    .filter(segment => segment !== "");

  const suffix = segments.length === 0 ? item.id : `${DownloaderConfig.filename.categorySeparator}${item.id}`;
  const name = capLength(segments.join(DownloaderConfig.filename.categorySeparator), suffix);
  return `${name}${suffix}.${extension}`;
}

function buildCategorySegment(tags: Set<string>, category: FilenameCategory, tagCategories: TagCategoryMap): string {
  const tagsInCategory = Array.from(tags)
    .filter(tag => tagCategories.get(tag) === category)
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
