import { GalleryAbstractImageBudgeter, GalleryLimitImageBudgeter, GalleryMemoryImageBudgeter } from "@/features/gallery/view/rendering/image/budgeter";
import { describe, expect, test } from "vitest";
import { MediaItem } from "@/types/media";

const PIXELS_PER_MB = 220_000;

function createItems(count: number): MediaItem[] {
  return Array.from({ length: count }, (_, i) => ({ id: String(i), thumbUrl: "", mediaType: "image" }));
}

function acceptedIdsFor(budgeter: GalleryAbstractImageBudgeter, candidates: MediaItem[]): string[] {
  return budgeter.partition(candidates).accepted.map(r => r.id);
}

function rejectedIdsFor(budgeter: GalleryAbstractImageBudgeter, candidates: MediaItem[]): string[] {
  return budgeter.partition(candidates).rejected.map(r => r.id);
}

describe("GalleryLimitImageBudgeter", () => {
  test("accepts up to the limit and rejects the rest", () => {
    const budgeter = new GalleryLimitImageBudgeter(4);
    const elements = createItems(6);

    expect(acceptedIdsFor(budgeter, elements)).toEqual(["0", "1", "2", "3"]);
    expect(rejectedIdsFor(budgeter, elements)).toEqual(["4", "5"]);
  });

  test("accepts everything when there are fewer requests than the limit", () => {
    const budgeter = new GalleryLimitImageBudgeter(10);
    const elements = createItems(3);

    expect(acceptedIdsFor(budgeter, elements)).toEqual(["0", "1", "2"]);
    expect(rejectedIdsFor(budgeter, elements)).toEqual([]);
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

  function createMemoryBudgeter(megabytesPerRequest: number): GalleryMemoryImageBudgeter {
    return new GalleryMemoryImageBudgeter(() => ({ pixelCount: megabytesPerRequest * PIXELS_PER_MB }), MEGABYTE_LIMIT, MINIMUM_COUNT);
  }

  test("accepts every request when the total never reaches the limit", () => {
    const budgeter = createMemoryBudgeter(10);
    const elements = createItems(3);

    expect(acceptedIdsFor(budgeter, elements)).toEqual(["0", "1", "2"]);
    expect(rejectedIdsFor(budgeter, elements)).toEqual([]);
  });

  test("keeps accepting past the memory limit until the minimum count is met", () => {
    const budgeter = createMemoryBudgeter(800);
    const elements = createItems(7);

    expect(acceptedIdsFor(budgeter, elements)).toHaveLength(MINIMUM_COUNT);
    expect(rejectedIdsFor(budgeter, elements)).toEqual(["5", "6"]);
  });

  test("stops once both the memory limit and the minimum count are satisfied", () => {
    const budgeter = createMemoryBudgeter(200);
    const elements = createItems(10);

    expect(acceptedIdsFor(budgeter, elements)).toEqual(["0", "1", "2", "3", "4"]);
    expect(rejectedIdsFor(budgeter, elements)).toEqual(["5", "6", "7", "8", "9"]);
  });

  test("treats images with no known favorite as free", () => {
    const budgeter = new GalleryMemoryImageBudgeter(() => undefined, MEGABYTE_LIMIT, MINIMUM_COUNT);
    const elements = createItems(10);

    expect(acceptedIdsFor(budgeter, elements)).toHaveLength(10);
    expect(rejectedIdsFor(budgeter, elements)).toEqual([]);
  });

  test("partitions an empty list into two empty lists", () => {
    const budgeter = createMemoryBudgeter(200);

    const { accepted, rejected } = budgeter.partition([]);

    expect(accepted).toEqual([]);
    expect(rejected).toEqual([]);
  });
});
