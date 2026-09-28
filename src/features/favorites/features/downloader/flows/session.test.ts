import { describe, expect, test, vi } from "vitest";
import { DownloaderContext } from "@/features/favorites/features/downloader/types/types";
import { DownloaderFlows } from "@/features/favorites/features/downloader/flows/flows";
import { DownloaderModel } from "@/features/favorites/features/downloader/model/model";
import { DownloaderSessionFlow } from "@/features/favorites/features/downloader/flows/session";
import { DownloaderShell } from "@/features/favorites/features/downloader/shell/shell";
import { DownloaderView } from "@/features/favorites/features/downloader/view/view";
import { PostMedia } from "@/core/domain/post/post";
import { createPreference } from "@/testing/preferences";

interface Options {
  itemCount?: number;
  batchSize?: number;
  hang?: boolean;
  broken?: boolean;
}

interface Setup {
  session: DownloaderSessionFlow;
  shell: DownloaderShell;
  results: PostMedia[];
  fetched: string[];
  saved: string[];
}

function createItems(count: number): PostMedia[] {
  return Array.from({ length: count }, (_, index) => ({ id: String(index), media: { kind: "image", locator: `media/${index}` } }));
}

function abortable(signal: AbortSignal): Promise<Blob> {
  return new Promise((_, reject) => {
    signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
  });
}

function setup({ itemCount = 3, batchSize = 0, hang = false, broken = false }: Options = {}): Setup {
  const shell = new DownloaderShell();
  const results = createItems(itemCount);
  const fetched: string[] = [];
  const saved: string[] = [];
  const context: DownloaderContext = {
    batchSize: createPreference(batchSize),
    filenameFormat: createPreference(0),
    getSearchResults: (): PostMedia[] => results,
    getTagCategory: (): undefined => undefined,
    getTagsForIds: (): Promise<Map<string, Set<string>>> => (broken ? Promise.reject(new Error("boom")) : Promise.resolve(new Map())),
    fetchOriginal: (media, signal): Promise<Blob> => {
      fetched.push(media.locator);
      return hang ? abortable(signal) : Promise.resolve(new Blob([new Uint8Array([1])], { type: "image/png" }));
    },
    saveBlob: (_blob, filename): number => saved.push(filename)
  };
  const { session } = new DownloaderFlows(context, new DownloaderModel(context), new DownloaderView(shell));
  return { session, shell, results, fetched, saved };
}

function isShown(element: HTMLElement): boolean {
  return element.dataset.hidden === undefined;
}

describe("DownloaderSessionFlow", () => {
  test("mounts the view", () => {
    const { session, shell } = setup();
    const container = document.createElement("div");

    session.mount(container);
    expect(container.contains(shell.actions)).toBe(true);
  });

  test("enabling clears the waiting status and offers the results", () => {
    const { session, shell } = setup();

    session.enable();
    expect(shell.status.textContent).toBe("");
    expect(isShown(shell.downloadButton)).toBe(true);
    expect(shell.downloadButton.disabled).toBe(false);
    expect(shell.downloadButton.textContent).toBe("Download 3 Results");
  });

  test("labels the batches it will save", () => {
    const { session, shell } = setup({ batchSize: 2 });

    session.enable();
    expect(shell.downloadButton.textContent).toBe("Download 3 Results · 2 zips");
  });

  test("disables download when there are no results", () => {
    const { session, shell } = setup({ itemCount: 0 });

    session.enable();
    expect(shell.downloadButton.disabled).toBe(true);
  });

  test("re-rendering before enable keeps waiting", () => {
    const { session, shell } = setup();

    session.reRender();
    expect(isShown(shell.downloadButton)).toBe(false);
    expect(shell.downloadButton.textContent).toBe("Download Results");
  });

  test("re-rendering picks up changed results", () => {
    const { session, shell, results } = setup();

    session.enable();
    results.pop();
    session.reRender();
    expect(shell.downloadButton.textContent).toBe("Download 2 Results");
  });

  test("ignores a download request before favorites load", async() => {
    const { session, fetched } = setup();

    await session.start();
    expect(fetched).toEqual([]);
  });

  test("reports when there is nothing to download", async() => {
    const { session, shell, results } = setup();

    session.enable();
    results.length = 0;
    await session.start();
    expect(shell.status.textContent).toBe("No search results to download");
  });

  test("downloads every batch and summarizes", async() => {
    const { session, shell, fetched, saved } = setup({ batchSize: 2 });

    session.enable();
    await session.start();
    expect(fetched.sort()).toEqual(["media/0", "media/1", "media/2"]);
    expect(saved).toEqual(["favorites_1of2.zip", "favorites_2of2.zip"]);
    expect(shell.status.textContent).toBe("Done: 3 downloaded");
    expect(shell.progressBar.element.textContent).toBe("2.png");
    expect(isShown(shell.downloadButton)).toBe(true);
  });

  test("shows the download in progress and ignores re-renders and repeat starts", async() => {
    const { session, shell, results, fetched } = setup({ hang: true });

    session.enable();
    session.start().catch(() => undefined);
    await vi.waitFor(() => expect(fetched).toHaveLength(3));
    results.pop();
    session.reRender();
    await session.start();
    expect(fetched).toHaveLength(3);
    expect(shell.status.textContent).toBe("Downloading 3...");
    expect([isShown(shell.downloadButton), isShown(shell.cancelButton)]).toEqual([false, true]);
    expect(shell.downloadButton.textContent).toBe("Download 3 Results");
    session.cancel();
  });

  test("cancelling aborts the download without saving", async() => {
    const { session, shell, fetched, saved } = setup({ hang: true });

    session.enable();
    const run = session.start();

    await vi.waitFor(() => expect(fetched).toHaveLength(3));
    session.cancel();
    await run;
    expect(saved).toEqual([]);
    expect(shell.status.textContent).toBe("Cancelled: 0 downloaded");
    expect(isShown(shell.downloadButton)).toBe(true);
  });

  test("cancelling with no download in flight does nothing", () => {
    const { session, shell } = setup();

    session.enable();
    session.cancel();
    expect(shell.status.textContent).toBe("");
  });

  test("returns to idle even when the download fails", async() => {
    const { session, shell } = setup({ broken: true });

    session.enable();
    await expect(session.start()).rejects.toThrow("boom");
    expect(isShown(shell.downloadButton)).toBe(true);
  });
});
