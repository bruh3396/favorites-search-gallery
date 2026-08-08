import { describe, expect, test } from "vitest";
import { FilenameCategory } from "@/features/favorites/features/downloader/types";
import { MediaItem } from "@/types/media";
import { TagCategory } from "@/types/search";
import { buildFilename } from "@/features/favorites/features/downloader/filename_builder";

const CATEGORIES: Record<string, TagCategory> = {
  "artist_one": "artist",
  "artist_two": "artist",
  "artist_two_(qualified)": "artist",
  "artist_three's_name": "artist",
  "character_one": "character",
  "character_two": "character",
  "character_one_(qualified)": "character",
  "copyright_one": "copyright",
  "copyright_one_(series)": "copyright",
  "copyright_two:_subtitle": "copyright",
  "general_one": "general",
  "metadata_one": "metadata"
};

const ALL: FilenameCategory[] = ["artist", "character", "copyright"];
const getTagCategory = (tag: string): TagCategory | undefined => CATEGORIES[tag];
const item = (...tags: string[]): MediaItem => ({ id: "10146816", thumbUrl: null, tags: new Set(tags) });
const build = (tags: string[], categories: FilenameCategory[] = ALL): string => buildFilename(item(...tags), "jpeg", categories, getTagCategory);

describe("buildFilename", () => {
  test("returns just the id when no categories are selected", () => {
    expect(build(["artist_one", "character_one"], [])).toBe("10146816.jpeg");
  });

  test("appends the id after the selected segments", () => {
    expect(build(["artist_one", "character_one", "copyright_one_(series)"])).toBe("artist_one--character_one--copyright_one_(series)--10146816.jpeg");
  });

  test("joins multiple tags in one category with a comma", () => {
    expect(build(["artist_one", "character_one", "character_two"], ["artist", "character"])).toBe("artist_one--character_one,character_two--10146816.jpeg");
  });

  test("ignores tags outside the selected categories", () => {
    expect(build(["artist_one", "general_one", "metadata_one"], ["artist"])).toBe("artist_one--10146816.jpeg");
  });

  test("drops a missing category rather than emitting an empty segment", () => {
    expect(build(["artist_one"], ["artist", "character"])).toBe("artist_one--10146816.jpeg");
  });

  test("falls back to the bare id when no selected category is present", () => {
    expect(build(["general_one"], ALL)).toBe("10146816.jpeg");
  });

  test("supports artist and copyright without character", () => {
    expect(build(["artist_one", "character_one", "copyright_one_(series)"], ["artist", "copyright"])).toBe("artist_one--copyright_one_(series)--10146816.jpeg");
  });

  test("drops a qualified duplicate when the base tag is present", () => {
    expect(build(["character_one", "character_one_(qualified)"], ["character"])).toBe("character_one--10146816.jpeg");
  });

  test("keeps a qualified tag when its base is absent", () => {
    expect(build(["artist_two_(qualified)"], ["artist"])).toBe("artist_two_(qualified)--10146816.jpeg");
  });

  test("strips colons that are illegal on windows", () => {
    expect(build(["copyright_two:_subtitle"], ["copyright"])).toBe("copyright_two_subtitle--10146816.jpeg");
  });

  test("strips apostrophes", () => {
    expect(build(["artist_three's_name"], ["artist"])).toBe("artist_threes_name--10146816.jpeg");
  });

  test("caps length while preserving the id", () => {
    const longTags = Array.from({ length: 40 }, (_, index) => `character_number_${String(index).padStart(3, "0")}`);
    const categories: Record<string, TagCategory> = Object.fromEntries(longTags.map(tag => [tag, "character"]));
    const name = buildFilename(item(...longTags), "jpeg", ["character"], tag => categories[tag]);

    expect(name.length).toBeLessThanOrEqual(215);
    expect(name.endsWith("--10146816.jpeg")).toBe(true);
  });
});
