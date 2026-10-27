import { FrozenCobaltTagCategoryCode, isFrozenCobaltTagCategoryCode } from "@/adapters/frozen_cobalt/wire/frozen_cobalt_tag_category_code";
import { isRecord } from "@/core/utils/guard/guard";

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

export function isFrozenCobaltPost(value: unknown): value is FrozenCobaltPost {
  return isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.width === "number" &&
    typeof value.height === "number" &&
    typeof value.score === "number" &&
    typeof value.rating === "string" &&
    typeof value.change === "number" &&
    typeof value.fileURL === "string" &&
    isRecord(value.tagCategories) &&
    Object.values(value.tagCategories).every(isFrozenCobaltTagCategoryCode);
}
