import { FrozenCobaltPost, isFrozenCobaltPost } from "@/adapters/frozen_cobalt/wire/frozen_cobalt_post";
import { isOneOf, isRecord } from "@/core/utils/guard/guard";
import { FrozenCobaltError } from "@/adapters/frozen_cobalt/client/frozen_cobalt_error";

const POST_FAILURE_STATUSES = ["rate_limited", "error", "deleted", "deferred"] as const;

export type FrozenCobaltPostResult =
  | { readonly status: "ok"; readonly post: FrozenCobaltPost }
  | { readonly status: typeof POST_FAILURE_STATUSES[number]; readonly id: string };

export function parseFrozenCobaltPostResult(value: unknown, postId: string): FrozenCobaltPostResult {
  if (!isPostResult(value)) {
    throw new FrozenCobaltError("malformed", { subject: postId });
  }
  return value;
}

function isPostResult(value: unknown): value is FrozenCobaltPostResult {
  if (!isRecord(value)) {
    return false;
  }

  if (value.status === "ok") {
    return isFrozenCobaltPost(value.post);
  }
  return isOneOf(POST_FAILURE_STATUSES, value.status) && typeof value.id === "string";
}
