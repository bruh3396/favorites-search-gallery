import { isOneOf } from "@/core/utils/guard/guard";

const FROZEN_COBALT_TAG_CATEGORIES = ["general", "artist", "copyright", "character", "metadata"] as const;

export type FrozenCobaltTagCategory = typeof FROZEN_COBALT_TAG_CATEGORIES[number];

export function isFrozenCobaltTagCategory(value: unknown): value is FrozenCobaltTagCategory {
  return isOneOf(FROZEN_COBALT_TAG_CATEGORIES, value);
}
