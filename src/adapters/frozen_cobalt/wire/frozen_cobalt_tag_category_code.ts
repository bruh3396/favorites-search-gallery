import { isOneOf } from "@/core/utils/guard/guard";

const FROZEN_COBALT_TAG_CATEGORY_CODES = [0, 1, 2, 3, 4, 5, null] as const;

export type FrozenCobaltTagCategoryCode = typeof FROZEN_COBALT_TAG_CATEGORY_CODES[number];

export function isFrozenCobaltTagCategoryCode(value: unknown): value is FrozenCobaltTagCategoryCode {
  return isOneOf(FROZEN_COBALT_TAG_CATEGORY_CODES, value);
}
