import { isOneOf, isRecord } from "@/core/utils/guards/guards";
import { FrozenCobaltError } from "@/adapters/frozen_cobalt/client/error";

const TAG_CATEGORY_CODES = [0, 1, 2, 3, 4, 5, null] as const;
const POST_FAILURE_STATUSES = ["rate_limited", "error", "deleted", "deferred"] as const;

export type FrozenCobaltTagCategoryCode = typeof TAG_CATEGORY_CODES[number];

export type FrozenCobaltPost = {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly score: number;
  readonly rating: string;
  readonly change: number;
  readonly fileURL: string;
  readonly tagCategories: Record<string, FrozenCobaltTagCategoryCode>;
};

export type FrozenCobaltPostResult =
  | { readonly status: "ok"; readonly post: FrozenCobaltPost }
  | { readonly status: typeof POST_FAILURE_STATUSES[number]; readonly id: string };

export type FrozenCobaltTagResult =
  | { readonly status: "ok"; readonly category: FrozenCobaltTagCategoryCode }
  | { readonly status: "rate_limited" };

export interface FrozenCobaltEndpoints {
  readonly ping: Record<string, never>;
  readonly post: { ids: string[] };
  readonly tag: { tagNames: string[] };
}

export function parseBatch(text: string): Record<string, unknown> {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch (cause) {
    throw new FrozenCobaltError("malformed", { cause });
  }

  if (!isRecord(parsed)) {
    throw new FrozenCobaltError("malformed");
  }
  return parsed;
}

export function parsePostResult(value: unknown, id: string): FrozenCobaltPostResult {
  if (!isPostResult(value)) {
    throw new FrozenCobaltError("malformed", { subject: id });
  }
  return value;
}

export function parseTagResult(value: unknown, tagName: string): FrozenCobaltTagResult {
  if (!isTagResult(value)) {
    throw new FrozenCobaltError("malformed", { subject: tagName });
  }
  return value;
}

function isPostResult(value: unknown): value is FrozenCobaltPostResult {
  if (!isRecord(value)) {
    return false;
  }

  if (value.status === "ok") {
    return isPost(value.post);
  }
  return isOneOf(POST_FAILURE_STATUSES, value.status) && typeof value.id === "string";
}

function isTagResult(value: unknown): value is FrozenCobaltTagResult {
  if (!isRecord(value)) {
    return false;
  }
  return value.status === "ok" ? isOneOf(TAG_CATEGORY_CODES, value.category) : value.status === "rate_limited";
}

function isPost(value: unknown): value is FrozenCobaltPost {
  return isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.width === "number" &&
    typeof value.height === "number" &&
    typeof value.score === "number" &&
    typeof value.rating === "string" &&
    typeof value.change === "number" &&
    typeof value.fileURL === "string" &&
    isRecord(value.tagCategories) &&
    Object.values(value.tagCategories).every(code => isOneOf(TAG_CATEGORY_CODES, code));
}
