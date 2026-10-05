import { itemsAround, wrappedItemsAround } from "@/core/utils/collection/array";

const PRELOAD_WINDOW_SIZE = 50;

export function wrappingItemsAroundId<T extends { id: string }>(items: T[], id: string): T[] {
  return wrappedItemsAround(items, indexOfId(items, id), PRELOAD_WINDOW_SIZE);
}

export function clampedItemsAroundId<T extends { id: string }>(items: T[], id: string): T[] {
  return itemsAround(items, indexOfId(items, id), PRELOAD_WINDOW_SIZE);
}

function indexOfId<T extends { id: string }>(items: T[], id: string): number {
  return items.findIndex(item => item.id === id);
}
