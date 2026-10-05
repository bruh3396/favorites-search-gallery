import { describe, expect, test } from "vitest";
import { DownloaderFilenamer } from "@/features/favorites/features/downloader/model/filenamer";
import { MediaItem } from "@/core/domain/post/post";
import { Preference } from "@/lib/storage/preference";
import { TagCategoryMap } from "@/core/domain/tag/tag";

const SEPARATOR = " ";
const CATEGORIES: TagCategoryMap = new Map([["artist_one", "artist"], ["character_one", "character"], ["copyright_one", "copyright"]]);
const PARTS = { tags: new Set(CATEGORIES.keys()), extension: "png", tagCategories: CATEGORIES };
const item: MediaItem = { id: "7", media: { kind: "image", locator: "1/7.jpg" } };

function createFilenamer(format: number): { filenamer: DownloaderFilenamer; filenameFormat: { value: number } } {
  const filenameFormat = { value: format };
  const filenamer = new DownloaderFilenamer({ filenameFormat: filenameFormat as Preference<number> });
  return { filenamer, filenameFormat };
}

describe("DownloaderFilenamer", () => {
  test("includes only the categories whose bits are set", () => {
    const { filenamer } = createFilenamer(0b101);

    expect(filenamer.filenameFor(item, PARTS)).toBe(["artist_one", "copyright_one", "7.png"].join(SEPARATOR));
  });

  test("uses just the id when no bits are set", () => {
    expect(createFilenamer(0).filenamer.filenameFor(item, PARTS)).toBe("7.png");
  });

  test("reads the format preference at call time", () => {
    const { filenamer, filenameFormat } = createFilenamer(0);

    filenameFormat.value = 0b010;

    expect(filenamer.filenameFor(item, PARTS)).toBe(["character_one", "7.png"].join(SEPARATOR));
  });

  test("offers one bit per category", () => {
    expect(createFilenamer(0).filenamer.options()).toEqual(new Map([[1, "Artist"], [2, "Character"], [4, "Copyright"]]));
  });
});
