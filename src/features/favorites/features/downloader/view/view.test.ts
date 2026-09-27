import { describe, expect, test } from "vitest";
import { DownloaderShell } from "@/features/favorites/features/downloader/shell/shell";
import { DownloaderView } from "@/features/favorites/features/downloader/view/view";

interface Setup {
  view: DownloaderView;
  shell: DownloaderShell;
}

interface Visibility {
  batchSize: boolean;
  filenameFormat: boolean;
  download: boolean;
  cancel: boolean;
  progress: boolean;
}

function setup(): Setup {
  const shell = new DownloaderShell();
  return { view: new DownloaderView(shell), shell };
}

function visibilityOf(shell: DownloaderShell): Visibility {
  return {
    batchSize: shell.batchSizeRow.dataset.hidden === undefined,
    filenameFormat: shell.filenameFormatRow.dataset.hidden === undefined,
    download: shell.downloadButton.dataset.hidden === undefined,
    cancel: shell.cancelButton.dataset.hidden === undefined,
    progress: shell.progressBar.element.dataset.visible !== undefined
  };
}

describe("DownloaderView", () => {
  test("mounts every slot into the container", () => {
    const { view, shell } = setup();
    const container = document.createElement("div");

    view.mount(container);
    expect(Array.from(container.children)).toEqual([shell.batchSizeRow, shell.filenameFormatRow, shell.progressBar.element, shell.status, shell.actions]);
  });

  test("starts waiting for favorites with everything hidden and download disabled", () => {
    const { shell } = setup();

    expect(visibilityOf(shell)).toEqual({ batchSize: false, filenameFormat: false, download: false, cancel: false, progress: false });
    expect(shell.downloadButton.disabled).toBe(true);
    expect(shell.downloadButton.textContent).toBe("Download Results");
    expect(shell.status.textContent).toBe("Waiting for favorites to load");
  });

  test.each([
    ["idle", { batchSize: true, filenameFormat: true, download: true, cancel: false, progress: false }],
    ["downloading", { batchSize: false, filenameFormat: false, download: false, cancel: true, progress: true }]
  ] as const)("shows the %s controls", (phase, expected) => {
    const { view, shell } = setup();

    view.render({ phase, label: "Download 3 Results", enabled: true });
    expect(visibilityOf(shell)).toEqual(expected);
  });

  test("labels and enables the download button", () => {
    const { view, shell } = setup();

    view.render({ phase: "idle", label: "Download 3 Results", enabled: true });
    expect(shell.downloadButton.disabled).toBe(false);
    expect(shell.downloadButton.textContent).toBe("Download 3 Results");
  });

  test("shows status text", () => {
    const { view, shell } = setup();

    view.showStatus("Done: 3 downloaded");
    expect(shell.status.textContent).toBe("Done: 3 downloaded");
  });

  test("shows progress as a filled fraction with a label", () => {
    const { view, shell } = setup();

    view.showProgress(1, 4, "a.png");
    expect(shell.progressBar.element.textContent).toBe("a.png");
    expect((shell.progressBar.element.firstElementChild as HTMLElement).style.width).toBe("25%");
  });
});
