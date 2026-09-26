import { BatchDownloader, DownloadPanel, DownloadProgress, DownloadResult } from "@/features/favorites/features/downloader/types";
import { Deferred, createDeferred, flushMicrotasks } from "@/testing/async";
import { describe, expect, test } from "vitest";
import { FavoritesDownloadSession } from "@/features/favorites/features/downloader/session";
import { MediaItem } from "@/types/media";
import { Preference } from "@/lib/storage/preference";

interface Setup {
  session: FavoritesDownloadSession;
  log: string[];
  results: MediaItem[];
  batchSize: { value: number };
  downloads: { signal: AbortSignal; onProgress: (progress: DownloadProgress) => void; done: Deferred<DownloadResult> }[];
}

function createItems(count: number): MediaItem[] {
  return Array.from({ length: count }, (_, index) => ({ id: String(index), thumbUrl: "", mediaType: "image" }));
}

function setup(itemCount = 3, size = 0): Setup {
  const log: string[] = [];
  const results = createItems(itemCount);
  const batchSize = { value: size };
  const downloads: Setup["downloads"] = [];
  const panel: DownloadPanel = {
    render: (phase, label, enabled) => log.push(`render ${phase} "${label}" ${enabled ? "enabled" : "disabled"}`),
    showStatus: text => log.push(`status "${text}"`),
    showProgress: (completed, total, label) => log.push(`progress ${completed}/${total} "${label}"`)
  };
  const batchDownloader: BatchDownloader = {
    download: (items, batch, signal, onProgress): Promise<DownloadResult> => {
      const done = createDeferred<DownloadResult>();

      log.push(`download ${items.length} by ${batch}`);
      downloads.push({ signal, onProgress, done });
      return done.promise;
    }
  };
  const session = new FavoritesDownloadSession({ panel, batchDownloader, batchSize: batchSize as Preference<number>, getSearchResults: (): MediaItem[] => results });
  return { session, log, results, batchSize, downloads };
}

function createProgress(overrides: Partial<DownloadProgress>): DownloadProgress {
  return { filename: "a.png", currentBatch: 1, totalBatches: 1, totalItems: 3, successCount: 1, failureCount: 0, ...overrides };
}

describe("FavoritesDownloadSession", () => {
  test("enabling clears the waiting status and shows the idle panel", () => {
    const { session, log } = setup();

    session.enable();

    expect(log).toEqual(["status \"\"", "render idle \"Download 3 Results\" enabled"]);
  });

  test("re-rendering before enable keeps the panel waiting", () => {
    const { session, log } = setup();

    session.reRender();

    expect(log).toEqual(["render waiting \"Download Results\" disabled"]);
  });

  test.each([
    [0, 0, "render idle \"Download Results\" disabled"],
    [1, 0, "render idle \"Download 1 Result\" enabled"],
    [1200, 0, "render idle \"Download 1200 Results\" enabled"],
    [1200, 500, "render idle \"Download 1200 Results · 3 zips\" enabled"],
    [400, 500, "render idle \"Download 400 Results\" enabled"]
  ])("labels %i results with batch size %i", (itemCount, size, expected) => {
    const { session, log } = setup(itemCount, size);

    session.enable();

    expect(log.at(-1)).toBe(expected);
  });

  test("ignores a download request before favorites load", async() => {
    const { session, log } = setup();

    await session.start();

    expect(log).toEqual([]);
  });

  test("reports when there is nothing to download", async() => {
    const { session, log, results } = setup();

    session.enable();
    results.length = 0;
    log.length = 0;
    await session.start();

    expect(log).toEqual(["status \"No search results to download\""]);
  });

  test("runs a download from start to summary", async() => {
    const { session, log, downloads } = setup(3, 2);

    session.enable();
    log.length = 0;
    const run = session.start();

    downloads[0].onProgress(createProgress({ totalBatches: 2, failureCount: 1 }));
    downloads[0].done.resolve({ successCount: 2, failureCount: 1, aborted: false });
    await run;

    expect(log).toEqual([
      "progress 0/3 \"\"",
      "render downloading \"Download 3 Results · 2 zips\" enabled",
      "status \"Downloading 3...\"",
      "download 3 by 2",
      "progress 2/3 \"a.png\"",
      "status \"Batch 1/2 - 1/3 (1 failed)\"",
      "status \"Done: 2 downloaded (1 failed)\"",
      "render idle \"Download 3 Results · 2 zips\" enabled"
    ]);
  });

  test("shows plain counts for a single batch", () => {
    const { session, log, downloads } = setup();

    session.enable();
    session.start().catch(() => undefined);
    downloads[0].onProgress(createProgress({}));

    expect(log.at(-1)).toBe("status \"1/3\"");
  });

  test("ignores re-renders and repeat starts while downloading", async() => {
    const { session, log, downloads } = setup();

    session.enable();
    session.start().catch(() => undefined);
    log.length = 0;
    session.reRender();
    await session.start();

    expect(log).toEqual([]);
    expect(downloads).toHaveLength(1);
  });

  test("cancelling aborts the download and reports it", async() => {
    const { session, log, downloads } = setup();

    session.enable();
    const run = session.start();

    session.cancel();
    expect(downloads[0].signal.aborted).toBe(true);
    downloads[0].done.resolve({ successCount: 1, failureCount: 0, aborted: true });
    await run;

    expect(log.slice(-2)).toEqual(["status \"Cancelled: 1 downloaded\"", "render idle \"Download 3 Results\" enabled"]);
  });

  test("cancelling with no download in flight does nothing", () => {
    const { session, log } = setup();

    session.cancel();

    expect(log).toEqual([]);
  });

  test("returns to idle even when the download fails", async() => {
    const { session, log, downloads } = setup();

    session.enable();
    const run = session.start();

    downloads[0].done.reject(new Error("boom"));
    await expect(run).rejects.toThrow("boom");
    await flushMicrotasks();

    expect(log.at(-1)).toBe("render idle \"Download 3 Results\" enabled");
  });
});
