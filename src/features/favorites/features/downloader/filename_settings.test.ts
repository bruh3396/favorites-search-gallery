import { describe, expect, test } from "vitest";
import { DownloaderConfig } from "@/config/downloader_config";
import { FavoritesFilenameSettings } from "@/features/favorites/features/downloader/filename_settings";
import { MediaItem } from "@/types/media";
import { Preference } from "@/lib/storage/preference";
import { TagCategory } from "@/types/search";

const SEPARATOR = DownloaderConfig.filename.categorySeparator;
const CATEGORIES: Record<string, TagCategory> = { "artist_one": "artist", "character_one": "character", "copyright_one": "copyright" };
const TAGS = new Set(Object.keys(CATEGORIES));
const item: MediaItem = { id: "7", thumbUrl: "", extension: "jpg", mediaType: "image" };

function createSettings(format: number): { settings: FavoritesFilenameSettings; filenameFormat: { value: number } } {
  const filenameFormat = { value: format };
  const settings = new FavoritesFilenameSettings({ filenameFormat: filenameFormat as Preference<number>, getTagCategory: (tag): TagCategory | undefined => CATEGORIES[tag] });
  return { settings, filenameFormat };
}

describe("FavoritesFilenameSettings", () => {
  test("includes only the categories whose bits are set", () => {
    const { settings } = createSettings(0b101);

    expect(settings.filenameFor(item, TAGS, "png")).toBe(["artist_one", "copyright_one", "7.png"].join(SEPARATOR));
  });

  test("uses just the id when no bits are set", () => {
    expect(createSettings(0).settings.filenameFor(item, TAGS, "png")).toBe("7.png");
  });

  test("reads the format preference at call time", () => {
    const { settings, filenameFormat } = createSettings(0);

    filenameFormat.value = 0b010;

    expect(settings.filenameFor(item, TAGS, "png")).toBe(["character_one", "7.png"].join(SEPARATOR));
  });

  test("offers one bit per category", () => {
    expect(createSettings(0).settings.options()).toEqual(new Map([[1, "Artist"], [2, "Character"], [4, "Copyright"]]));
  });
});
