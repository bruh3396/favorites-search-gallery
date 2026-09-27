import { describe, expect, test } from "vitest";
import { DownloaderShell } from "@/features/favorites/features/downloader/shell/shell";

describe("DownloaderShell", () => {
  test("builds distinct slots", () => {
    const { batchSizeRow, filenameFormatRow, progressBar, status, actions } = new DownloaderShell();
    const slots = [batchSizeRow, filenameFormatRow, progressBar.element, status, actions];

    expect(new Set(slots).size).toBe(slots.length);
  });

  test("puts both buttons inside the actions slot", () => {
    const { downloadButton, cancelButton, actions } = new DownloaderShell();

    expect(Array.from(actions.children)).toEqual([downloadButton, cancelButton]);
  });

  test("tags the buttons with their actions", () => {
    const { downloadButton, cancelButton } = new DownloaderShell();

    expect([downloadButton.dataset.downloaderAction, cancelButton.dataset.downloaderAction]).toEqual(["start", "cancel"]);
  });

  test("announces the status", () => {
    expect(new DownloaderShell().status.getAttribute("role")).toBe("status");
  });
});
