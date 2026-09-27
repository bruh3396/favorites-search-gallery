import { afterEach, describe, expect, test } from "vitest";
import { FavoritesAspectRatios } from "@/features/favorites/view/skeleton/aspect_ratios";

function createThumb(width: number, height: number): HTMLElement {
  const thumb = document.createElement("div");
  const image = document.createElement("img");

  Object.defineProperty(image, "naturalWidth", { value: width });
  Object.defineProperty(image, "naturalHeight", { value: height });
  thumb.append(image);
  return thumb;
}

function remainingOf(aspectRatios: FavoritesAspectRatios): string[] {
  const remaining: string[] = [];

  for (let next = aspectRatios.getNext(); next !== undefined; next = aspectRatios.getNext()) {
    remaining.push(next);
  }
  return remaining;
}

describe("FavoritesAspectRatios", () => {
  afterEach(() => {
    localStorage.clear();
  });

  test("knows nothing on a first visit", () => {
    expect(new FavoritesAspectRatios().getNext()).toBeUndefined();
  });

  test("the next visit gets the collected aspect ratios back in thumb order", () => {
    new FavoritesAspectRatios().collect([createThumb(100, 200), document.createElement("div"), createThumb(300, 150)]);
    expect(remainingOf(new FavoritesAspectRatios())).toEqual(["100/200", "300/150"]);
  });

  test("keeps only the first fifty thumbs", () => {
    const thumbs = Array.from({ length: 60 }, (_, index) => createThumb(index + 1, 1));

    new FavoritesAspectRatios().collect(thumbs);
    const remaining = remainingOf(new FavoritesAspectRatios());

    expect(remaining).toHaveLength(50);
    expect(remaining.at(-1)).toBe("50/1");
  });
});
