import { GalleryAbstractImageBudgeter, GalleryLimitImageBudgeter, GalleryMemoryImageBudgeter } from "@/features/gallery/view/rendering/image/budgeter";
import { describe, expect, test } from "vitest";
import { PostMedia } from "@/core/domain/post/post";

const PIXELS_PER_MB = 220_000;

function createItems(count: number): PostMedia[] {
  return Array.from({ length: count }, (_, i) => ({ id: String(i), media: { kind: "image", locator: "" } }));
}

function partitionAcceptedIds(budgeter: GalleryAbstractImageBudgeter, candidates: PostMedia[]): string[] {
  return budgeter.partition(candidates).accepted.map(r => r.id);
}

function partitionRejectedIds(budgeter: GalleryAbstractImageBudgeter, candidates: PostMedia[]): string[] {
  return budgeter.partition(candidates).rejected.map(r => r.id);
}

describe("GalleryLimitImageBudgeter", () => {
  test("accepts up to the limit and rejects the rest", () => {
    const budgeter = new GalleryLimitImageBudgeter(4);
    const elements = createItems(6);

    expect(partitionAcceptedIds(budgeter, elements)).toEqual(["0", "1", "2", "3"]);
    expect(partitionRejectedIds(budgeter, elements)).toEqual(["4", "5"]);
  });

  test("accepts everything when there are fewer requests than the limit", () => {
    const budgeter = new GalleryLimitImageBudgeter(10);
    const elements = createItems(3);

    expect(partitionAcceptedIds(budgeter, elements)).toEqual(["0", "1", "2"]);
    expect(partitionRejectedIds(budgeter, elements)).toEqual([]);
  });

  test("partitions an empty list into two empty lists", () => {
    const budgeter = new GalleryLimitImageBudgeter(4);

    const { accepted, rejected } = budgeter.partition([]);

    expect(accepted).toEqual([]);
    expect(rejected).toEqual([]);
  });
});

describe("GalleryMemoryImageBudgeter", () => {
  const MEGABYTE_LIMIT = 700;
  const MINIMUM_COUNT = 5;
  const BUDGET = { megabyteLimit: MEGABYTE_LIMIT, minimumCount: MINIMUM_COUNT };

  function createMemoryBudgeter(megabytesPerRequest: number): GalleryMemoryImageBudgeter {
    return new GalleryMemoryImageBudgeter(BUDGET, () => ({ pixelCount: megabytesPerRequest * PIXELS_PER_MB }));
  }

  test("accepts every request when the total never reaches the limit", () => {
    const budgeter = createMemoryBudgeter(10);
    const elements = createItems(3);

    expect(partitionAcceptedIds(budgeter, elements)).toEqual(["0", "1", "2"]);
    expect(partitionRejectedIds(budgeter, elements)).toEqual([]);
  });

  test("keeps accepting past the memory limit until the minimum count is met", () => {
    const budgeter = createMemoryBudgeter(800);
    const elements = createItems(7);

    expect(partitionAcceptedIds(budgeter, elements)).toHaveLength(MINIMUM_COUNT);
    expect(partitionRejectedIds(budgeter, elements)).toEqual(["5", "6"]);
  });

  test("stops once both the memory limit and the minimum count are satisfied", () => {
    const budgeter = createMemoryBudgeter(200);
    const elements = createItems(10);

    expect(partitionAcceptedIds(budgeter, elements)).toEqual(["0", "1", "2", "3", "4"]);
    expect(partitionRejectedIds(budgeter, elements)).toEqual(["5", "6", "7", "8", "9"]);
  });

  test("treats images with no known favorite as free", () => {
    const budgeter = new GalleryMemoryImageBudgeter(BUDGET, () => undefined);
    const elements = createItems(10);

    expect(partitionAcceptedIds(budgeter, elements)).toHaveLength(10);
    expect(partitionRejectedIds(budgeter, elements)).toEqual([]);
  });

  test("partitions an empty list into two empty lists", () => {
    const budgeter = createMemoryBudgeter(200);

    const { accepted, rejected } = budgeter.partition([]);

    expect(accepted).toEqual([]);
    expect(rejected).toEqual([]);
  });
});
