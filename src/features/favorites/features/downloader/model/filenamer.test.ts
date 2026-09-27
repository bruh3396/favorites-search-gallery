import { describe, expect, test } from "vitest";
import { DownloaderConfig } from "@/config/downloader_config";
import { DownloaderFilenamer } from "@/features/favorites/features/downloader/model/filenamer";
import { MediaItem } from "@/types/media";
import { Preference } from "@/lib/storage/preference";
import { TagCategory } from "@/types/search";

const SEPARATOR = DownloaderConfig.filename.categorySeparator;
const CATEGORIES: Record<string, TagCategory> = { "artist_one": "artist", "character_one": "character", "copyright_one": "copyright" };
const TAGS = new Set(Object.keys(CATEGORIES));
const item: MediaItem = { id: "7", thumbUrl: "", extension: "jpg", mediaType: "image" };

function createFilenamer(format: number): { filenamer: DownloaderFilenamer; filenameFormat: { value: number } } {
  const filenameFormat = { value: format };
  const filenamer = new DownloaderFilenamer({ filenameFormat: filenameFormat as Preference<number>, getTagCategory: (tag): TagCategory | undefined => CATEGORIES[tag] });
  return { filenamer, filenameFormat };
}

describe("DownloaderFilenamer", () => {
  test("includes only the categories whose bits are set", () => {
    const { filenamer } = createFilenamer(0b101);

    expect(filenamer.filenameFor(item, TAGS, "png")).toBe(["artist_one", "copyright_one", "7.png"].join(SEPARATOR));
  });

  test("uses just the id when no bits are set", () => {
    expect(createFilenamer(0).filenamer.filenameFor(item, TAGS, "png")).toBe("7.png");
  });

  test("reads the format preference at call time", () => {
    const { filenamer, filenameFormat } = createFilenamer(0);

    filenameFormat.value = 0b010;

    expect(filenamer.filenameFor(item, TAGS, "png")).toBe(["character_one", "7.png"].join(SEPARATOR));
  });

  test("offers one bit per category", () => {
    expect(createFilenamer(0).filenamer.options()).toEqual(new Map([[1, "Artist"], [2, "Character"], [4, "Copyright"]]));
  });
});
