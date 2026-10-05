import { FilenameCategory, FilenameParts } from "@/features/favorites/features/downloader/types/types";
import { MediaItem } from "@/core/domain/post/post";
import { TagCategoryMap } from "@/core/domain/tag/tag";

const TAG_SEPARATOR = " ";
const CATEGORY_SEPARATOR = " ";
const MAX_LENGTH = 200;
const STRIPPED_CHARACTERS = /[<>:"/\\|?*' -]/g;
const TRAILING_QUALIFIER = /_\([^)]*\)$/;

export function build(item: MediaItem, { tags, extension, tagCategories }: FilenameParts, categories: FilenameCategory[]): string {
  const segments: string[] = categories
    .map(category => buildCategorySegment(tags, category, tagCategories))
    .filter(segment => segment !== "");

  const suffix = segments.length === 0 ? item.id : `${CATEGORY_SEPARATOR}${item.id}`;
  const name = capLength(segments.join(CATEGORY_SEPARATOR), suffix);
  return `${name}${suffix}.${extension}`;
}

function buildCategorySegment(tags: Set<string>, category: FilenameCategory, tagCategories: TagCategoryMap): string {
  const tagsInCategory = [...tags]
    .filter(tag => tagCategories.get(tag) === category)
    .sort();
  return dropQualifiedDuplicates(tagsInCategory)
    .map(sanitizeForFilename)
    .filter(tag => tag !== "")
    .join(TAG_SEPARATOR);
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
  if (name.length + suffix.length <= MAX_LENGTH) {
    return name;
  }
  const truncatedName = name.slice(0, Math.max(0, MAX_LENGTH - suffix.length));
  return truncatedName.replace(/[^a-z0-9]+$/i, "");
}
