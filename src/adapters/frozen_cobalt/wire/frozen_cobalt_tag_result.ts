import { FrozenCobaltTagCategory, isFrozenCobaltTagCategory } from "@/adapters/frozen_cobalt/wire/frozen_cobalt_tag_category";
import { FrozenCobaltError } from "@/adapters/frozen_cobalt/client/frozen_cobalt_error";
import { isOneOf, isRecord } from "@/core/utils/guard/unknown_utilities";

const TAG_FAILURE_STATUSES = ["not_found", "retry"] as const;

export type FrozenCobaltTagResult =
  | { readonly status: "ok"; readonly category: FrozenCobaltTagCategory }
  | { readonly status: typeof TAG_FAILURE_STATUSES[number] };

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
  return value.status === "ok" ? isFrozenCobaltTagCategory(value.category) : isOneOf(TAG_FAILURE_STATUSES, value.status);
}
