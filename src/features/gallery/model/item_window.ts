import { itemsAround, wrappedItemsAround } from "@/utils/pure/array";
import { Identifiable } from "@/types/app";

const PRELOAD_WINDOW_SIZE = 50;

export function wrappingThumbsAroundId<T extends Identifiable, R>(items: T[], id: string, toThumb: (item: T) => R): R[] {
  return wrappedItemsAround(items, indexOfId(items, id), PRELOAD_WINDOW_SIZE).map(toThumb);
}

export function clampedThumbsAroundId<T extends Identifiable, R>(items: T[], id: string, toThumb: (item: T) => R): R[] {
  return itemsAround(items, indexOfId(items, id), PRELOAD_WINDOW_SIZE).map(toThumb);
}

function indexOfId<T extends Identifiable>(items: T[], id: string): number {
  return items.findIndex(item => item.id === id);
}
