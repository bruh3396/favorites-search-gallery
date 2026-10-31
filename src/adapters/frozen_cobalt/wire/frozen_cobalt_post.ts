import { FrozenCobaltTagCategory, isFrozenCobaltTagCategory } from "@/adapters/frozen_cobalt/wire/frozen_cobalt_tag_category";
import { RATINGS, Rating } from "@/core/domain/post/rating";
import { isOneOf, isRecord } from "@/core/utils/guard/guard";

export type FrozenCobaltPost = {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly score: number;
  readonly rating: Rating;
  readonly changedAt: number;
  readonly directory: number;
  readonly stem: string;
  readonly extension: string;
  readonly tagCategoryByName: Record<string, FrozenCobaltTagCategory>;
};

export function isFrozenCobaltPost(value: unknown): value is FrozenCobaltPost {
  return isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.width === "number" &&
    typeof value.height === "number" &&
    typeof value.score === "number" &&
    isOneOf(RATINGS, value.rating) &&
    typeof value.changedAt === "number" &&
    typeof value.directory === "number" &&
    typeof value.stem === "string" &&
    typeof value.extension === "string" &&
    isRecord(value.tagCategoryByName) &&
    Object.values(value.tagCategoryByName).every(isFrozenCobaltTagCategory);
}
