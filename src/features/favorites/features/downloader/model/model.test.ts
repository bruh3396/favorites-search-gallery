import { DownloaderContext, DownloaderProgress } from "@/features/favorites/features/downloader/types/types";
import { describe, expect, test } from "vitest";
import { DownloaderConfig } from "@/config/downloader_config";
import { DownloaderModel } from "@/features/favorites/features/downloader/model/model";
import { PostMedia } from "@/core/domain/post/post";
import { TagCategory } from "@/core/domain/tag/tag";
import { createPreference } from "@/testing/preferences";

const SEPARATOR = DownloaderConfig.filename.categorySeparator;

interface Setup {
  model: DownloaderModel;
  fetched: string[];
  saved: string[];
}

function createItem(id: string): PostMedia {
  return { id, media: { kind: "image", locator: `media/${id}` } };
}

function setup(filenameFormat = 0): Setup {
  const fetched: string[] = [];
  const saved: string[] = [];
  const context: DownloaderContext = {
    batchSize: createPreference(0),
    filenameFormat: createPreference(filenameFormat),
    getSearchResults: (): PostMedia[] => [],
    getTagCategory: (tag): TagCategory | undefined => (tag === "someone" ? "artist" : undefined),
    getTagsForIds: (ids): Promise<Map<string, Set<string>>> => Promise.resolve(new Map(ids.map(id => [id, new Set(["someone"])]))),
    fetchOriginal: (media): Promise<Blob> => {
      fetched.push(media.locator);
      return Promise.resolve(new Blob([new Uint8Array([1])], { type: "image/png" }));
    },
    saveBlob: (_blob, filename): number => saved.push(filename)
  };
  return { model: new DownloaderModel(context), fetched, saved };
}

describe("DownloaderModel", () => {
  test("offers one filename option per category", () => {
    expect(setup().model.filenameOptions()).toEqual(new Map([[1, "Artist"], [2, "Character"], [4, "Copyright"]]));
  });

  test("downloads the items into a saved zip, named by the chosen categories", async() => {
    const { model, fetched, saved } = setup(1);
    const progress: DownloaderProgress[] = [];
    const result = await model.download([createItem("1"), createItem("2")], 0, new AbortController().signal, update => progress.push(update));

    expect(result).toEqual({ successCount: 2, failureCount: 0, aborted: false });
    expect(fetched.sort()).toEqual(["media/1", "media/2"]);
    expect(saved).toEqual(["favorites.zip"]);
    expect(progress.map(update => update.filename).sort()).toEqual([`someone${SEPARATOR}1.png`, `someone${SEPARATOR}2.png`]);
  });

  test("describes the download", () => {
    const { model } = setup();

    expect(model.downloadLabel(3, 2)).toBe("Download 3 Results · 2 zips");
    expect(model.summarize({ successCount: 3, failureCount: 0, aborted: false })).toBe("Done: 3 downloaded");
    expect(model.describeProgress({ filename: "a.png", currentBatch: 1, totalBatches: 1, totalItems: 3, successCount: 1, failureCount: 0 })).toBe("1/3");
  });
});
