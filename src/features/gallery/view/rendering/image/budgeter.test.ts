import { GalleryAbstractImageBudgeter, GalleryLimitImageBudgeter, GalleryMemoryImageBudgeter } from "@/features/gallery/view/rendering/image/budgeter";
import { describe, expect, test } from "vitest";
import { MediaItem } from "@/types/media";

const PIXELS_PER_MB = 220_000;

function items(count: number): MediaItem[] {
  return Array.from({ length: count }, (_, i) => ({ id: String(i), thumbUrl: "", mediaType: "image" }));
}

function acceptedIds(budgeter: GalleryAbstractImageBudgeter, candidates: MediaItem[]): string[] {
  return budgeter.partition(candidates).accepted.map(r => r.id);
}

function rejectedIds(budgeter: GalleryAbstractImageBudgeter, candidates: MediaItem[]): string[] {
  return budgeter.partition(candidates).rejected.map(r => r.id);
}

describe("GalleryLimitImageBudgeter", () => {
  test("accepts up to the limit and rejects the rest", () => {
    const budgeter = new GalleryLimitImageBudgeter(4);
    const elements = items(6);

    expect(acceptedIds(budgeter, elements)).toEqual(["0", "1", "2", "3"]);
    expect(rejectedIds(budgeter, elements)).toEqual(["4", "5"]);
  });

  test("accepts everything when there are fewer requests than the limit", () => {
    const budgeter = new GalleryLimitImageBudgeter(10);
    const elements = items(3);

    expect(acceptedIds(budgeter, elements)).toEqual(["0", "1", "2"]);
    expect(rejectedIds(budgeter, elements)).toEqual([]);
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

  function createMemoryBudgeterWithUniformSize(megabytesPerRequest: number): GalleryMemoryImageBudgeter {
    return new GalleryMemoryImageBudgeter(() => megabytesPerRequest * PIXELS_PER_MB, MEGABYTE_LIMIT, MINIMUM_COUNT);
  }

  test("accepts every request when the total never reaches the limit", () => {
    const budgeter = createMemoryBudgeterWithUniformSize(10);
    const elements = items(3);

    expect(acceptedIds(budgeter, elements)).toEqual(["0", "1", "2"]);
    expect(rejectedIds(budgeter, elements)).toEqual([]);
  });

  test("keeps accepting past the memory limit until the minimum count is met", () => {
    const budgeter = createMemoryBudgeterWithUniformSize(800);
    const elements = items(7);

    expect(acceptedIds(budgeter, elements)).toHaveLength(MINIMUM_COUNT);
    expect(rejectedIds(budgeter, elements)).toEqual(["5", "6"]);
  });

  test("stops once both the memory limit and the minimum count are satisfied", () => {
    const budgeter = createMemoryBudgeterWithUniformSize(200);
    const elements = items(10);

    expect(acceptedIds(budgeter, elements)).toEqual(["0", "1", "2", "3", "4"]);
    expect(rejectedIds(budgeter, elements)).toEqual(["5", "6", "7", "8", "9"]);
  });

  test("partitions an empty list into two empty lists", () => {
    const budgeter = createMemoryBudgeterWithUniformSize(200);

    const { accepted, rejected } = budgeter.partition([]);

    expect(accepted).toEqual([]);
    expect(rejected).toEqual([]);
  });
});
