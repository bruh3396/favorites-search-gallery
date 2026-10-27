import { FrozenCobaltTagCategoryCode, isFrozenCobaltTagCategoryCode } from "@/adapters/frozen_cobalt/wire/frozen_cobalt_tag_category_code";
import { FrozenCobaltError } from "@/adapters/frozen_cobalt/client/frozen_cobalt_error";
import { isRecord } from "@/core/utils/guard/guard";

export type FrozenCobaltTagResult =
  | { readonly status: "ok"; readonly category: FrozenCobaltTagCategoryCode }
  | { readonly status: "rate_limited" };

export function parseFrozenCobaltTagResult(value: unknown, tagName: string): FrozenCobaltTagResult {
  if (!isTagResult(value)) {
    throw new FrozenCobaltError("malformed", { subject: tagName });
  }
  return value;
}

function isTagResult(value: unknown): value is FrozenCobaltTagResult {
  if (!isRecord(value)) {
    return false;
  }
  return value.status === "ok" ? isFrozenCobaltTagCategoryCode(value.category) : value.status === "rate_limited";
}
