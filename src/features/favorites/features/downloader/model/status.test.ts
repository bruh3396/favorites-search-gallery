import * as DownloaderStatus from "@/features/favorites/features/downloader/model/status";
import { describe, expect, test } from "vitest";
import { DownloaderProgress } from "@/features/favorites/features/downloader/types/types";

function createProgress(overrides: Partial<DownloaderProgress>): DownloaderProgress {
  return { filename: "a.png", currentBatch: 1, totalBatches: 1, totalItems: 3, successCount: 1, failureCount: 0, ...overrides };
}

describe("label", () => {
  test.each([
    [0, 0, "Download Results"],
    [1, 0, "Download 1 Result"],
    [1200, 0, "Download 1200 Results"],
    [1200, 500, "Download 1200 Results · 3 zips"],
    [400, 500, "Download 400 Results"]
  ])("labels %i results with batch size %i", (itemCount, batchSize, expected) => {
    expect(DownloaderStatus.label(itemCount, batchSize)).toBe(expected);
  });
});

describe("summary", () => {
  test.each([
    [{ successCount: 3, failureCount: 0, aborted: false }, "Done: 3 downloaded"],
    [{ successCount: 2, failureCount: 1, aborted: false }, "Done: 2 downloaded (1 failed)"],
    [{ successCount: 1, failureCount: 0, aborted: true }, "Cancelled: 1 downloaded"]
  ])("summarizes %o", (result, expected) => {
    expect(DownloaderStatus.summary(result)).toBe(expected);
  });
});

describe("progress", () => {
  test("shows plain counts for a single batch", () => {
    expect(DownloaderStatus.progress(createProgress({}))).toBe("1/3");
  });

  test("names the batch and failures when there are several batches", () => {
    expect(DownloaderStatus.progress(createProgress({ totalBatches: 2, failureCount: 1 }))).toBe("Batch 1/2 - 1/3 (1 failed)");
  });
});
