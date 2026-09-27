import { Archiver, DownloaderProgress } from "@/features/favorites/features/downloader/types/types";
import { describe, expect, test } from "vitest";
import { DownloaderBatcher } from "@/features/favorites/features/downloader/model/batcher";
import { MediaItem } from "@/types/media";

interface Setup {
  downloader: DownloaderBatcher;
  saved: string[];
  archived: string[][];
}

function createItems(count: number): MediaItem[] {
  return Array.from({ length: count }, (_, index) => ({ id: String(index + 1), thumbUrl: "", mediaType: "image" }));
}

function setup({ failing = new Set<string>(), emptyBatches = new Set<number>(), onBatch = (): void => undefined } = {}): Setup {
  const saved: string[] = [];
  const archived: string[][] = [];
  const archiver: Archiver = {
    archive: (items, _signal, onItemSettled): Promise<Blob | null> => {
      archived.push(items.map(item => item.id));

      for (const item of items) {
        onItemSettled(failing.has(item.id) ? null : `${item.id}.png`);
      }
      onBatch();
      return Promise.resolve(emptyBatches.has(archived.length) ? null : new Blob());
    }
  };
  const downloader = new DownloaderBatcher({ archiver, saveBlob: (_blob, filename): void => {
    saved.push(filename);
  } });
  return { downloader, saved, archived };
}

async function download(downloader: DownloaderBatcher, items: MediaItem[], batchSize: number, signal = new AbortController().signal): Promise<{ result: Awaited<ReturnType<DownloaderBatcher["download"]>>; progress: DownloaderProgress[] }> {
  const progress: DownloaderProgress[] = [];
  const result = await downloader.download(items, batchSize, signal, update => progress.push(update));
  return { result, progress };
}

describe("DownloaderBatcher", () => {
  test("saves a single unbatched archive", async() => {
    const { downloader, saved, archived } = setup();
    const { result } = await download(downloader, createItems(3), 0);

    expect(archived).toEqual([["1", "2", "3"]]);
    expect(saved).toEqual(["favorites.zip"]);
    expect(result).toEqual({ successCount: 3, failureCount: 0, aborted: false });
  });

  test("splits into numbered, zero-padded batches", async() => {
    const { downloader, saved, archived } = setup();

    await download(downloader, createItems(10), 1);

    expect(archived).toHaveLength(10);
    expect(saved[0]).toBe("favorites_01of10.zip");
    expect(saved[9]).toBe("favorites_10of10.zip");
  });

  test("reports running counts across batches", async() => {
    const { downloader } = setup({ failing: new Set(["2"]) });
    const { result, progress } = await download(downloader, createItems(3), 2);

    expect(progress).toEqual([
      { filename: "1.png", currentBatch: 1, totalBatches: 2, totalItems: 3, successCount: 1, failureCount: 0 },
      { filename: "", currentBatch: 1, totalBatches: 2, totalItems: 3, successCount: 1, failureCount: 1 },
      { filename: "3.png", currentBatch: 2, totalBatches: 2, totalItems: 3, successCount: 2, failureCount: 1 }
    ]);
    expect(result).toEqual({ successCount: 2, failureCount: 1, aborted: false });
  });

  test("skips saving a batch that produced no archive", async() => {
    const { downloader, saved } = setup({ emptyBatches: new Set([1]) });

    await download(downloader, createItems(2), 1);

    expect(saved).toEqual(["favorites_2of2.zip"]);
  });

  test("stops before the next batch once aborted", async() => {
    const controller = new AbortController();
    const { downloader, archived } = setup({ onBatch: () => controller.abort() });
    const { result } = await download(downloader, createItems(3), 1, controller.signal);

    expect(archived).toEqual([["1"]]);
    expect(result.aborted).toBe(true);
  });
});
