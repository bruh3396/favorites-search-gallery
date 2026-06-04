import { TagCategory, TagCategoryMap } from "@/types/search";

const cache: TagCategoryMap = new Map();

export function get(tagName: string): TagCategory | undefined {
  return cache.get(tagName);
}

export function has(tagName: string): boolean {
  return cache.has(tagName);
}

export function set(tagName: string, category: TagCategory): void {
  cache.set(tagName, category);
}
