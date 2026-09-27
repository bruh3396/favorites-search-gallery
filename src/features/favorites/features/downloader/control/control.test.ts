import { describe, expect, test } from "vitest";
import { DownloaderConfig } from "@/config/downloader_config";
import { DownloaderControl } from "@/features/favorites/features/downloader/control/control";
import { DownloaderIntents } from "@/features/favorites/features/downloader/types/types";
import { DownloaderShell } from "@/features/favorites/features/downloader/shell/shell";
import { Preference } from "@/lib/storage/preference";
import { createPreference } from "@/testing/preferences";

interface Setup {
  shell: DownloaderShell;
  calls: string[];
  batchSize: Preference<number>;
  filenameFormat: Preference<number>;
}

function setup(): Setup {
  const shell = new DownloaderShell();
  const calls: string[] = [];
  const batchSize = createPreference(0);
  const filenameFormat = createPreference(0);
  const intents: DownloaderIntents = {
    start: (): number => calls.push("start"),
    cancel: (): number => calls.push("cancel")
  };

  new DownloaderControl(shell, intents, { batchSize, filenameFormat, filenameOptions: new Map([[1, "Artist"], [2, "Character"]]) });
  return { shell, calls, batchSize, filenameFormat };
}

function optionsOf(row: HTMLElement): HTMLButtonElement[] {
  return Array.from(row.querySelectorAll("button"));
}

describe("DownloaderControl", () => {
  test("offers every configured batch size, with zero meaning all", () => {
    const { shell } = setup();

    expect(DownloaderConfig.batchSizeOptions).toEqual([100, 250, 500, 1_000, 0]);
    expect(optionsOf(shell.batchSizeRow).map(button => button.textContent)).toEqual(["100", "250", "500", "1000", "All"]);
  });

  test("offers the filename options it was given", () => {
    const { shell } = setup();

    expect(optionsOf(shell.filenameFormatRow).map(button => button.textContent)).toEqual(["Artist", "Character"]);
  });

  test("writes chosen options to their preferences", () => {
    const { shell, batchSize, filenameFormat } = setup();

    optionsOf(shell.batchSizeRow)[0].click();
    optionsOf(shell.filenameFormatRow)[1].click();
    expect([batchSize.value, filenameFormat.value]).toEqual([100, 2]);
  });

  test("turns download and cancel clicks into intents", () => {
    const { shell, calls } = setup();

    shell.downloadButton.click();
    shell.cancelButton.click();
    expect(calls).toEqual(["start", "cancel"]);
  });

  test("ignores clicks outside the buttons", () => {
    const { shell, calls } = setup();

    shell.actions.click();
    expect(calls).toEqual([]);
  });
});
