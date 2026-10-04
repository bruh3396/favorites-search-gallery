import { afterEach, describe, expect, test, vi } from "vitest";
import { Downloader } from "@/features/favorites/features/downloader/downloader";
import { PostMedia } from "@/core/domain/post/post";
import { TagCategoryMap } from "@/core/domain/tag/tag";
import { createPreference } from "@/testing/preferences";

interface Setup {
  container: HTMLElement;
  downloader: Downloader;
  results: PostMedia[];
  fetched: string[];
  saved: string[];
}

function createItem(id: string): PostMedia {
  return { id, media: { kind: "image", locator: `1/${id}.png` } };
}

function queryActionButtons(container: HTMLElement): [HTMLButtonElement, HTMLButtonElement] {
  const [download, cancel] = container.querySelectorAll<HTMLButtonElement>("[data-downloader-action]");
  return [download, cancel];
}

function readStatus(container: HTMLElement): string {
  return container.querySelector("[role=status]")?.textContent ?? "";
}

function abortable(signal: AbortSignal): Promise<Blob> {
  return new Promise((_, reject) => {
    signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
  });
}

function setup({ hang = false } = {}): Setup {
  const container = document.createElement("div");
  const results = [createItem("a"), createItem("b")];
  const fetched: string[] = [];
  const saved: string[] = [];

  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function save(this: HTMLAnchorElement): void {
    saved.push(this.download);
  });
  const downloader = new Downloader({
    batchSize: createPreference(0),
    filenameFormat: createPreference(0),
    getSearchResults: (): PostMedia[] => results,
    getTagCategories: (): Promise<TagCategoryMap> => Promise.resolve(new Map()),
    getTagsForIds: (ids): Promise<Map<string, Set<string>>> => Promise.resolve(new Map(ids.map(id => [id, new Set([`tag_${id}`])]))),
    fetchOriginal: (media, signal): Promise<Blob> => {
      fetched.push(media.locator);
      return hang ? abortable(signal) : Promise.resolve(new Blob([new Uint8Array([1])], { type: "image/png" }));
    }
  });

  downloader.buildDrawerSection().mount?.(container);
  return { container, downloader, results, fetched, saved };
}

describe("Downloader", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("mounts a section that waits for favorites to load", () => {
    const { container } = setup();
    const [download] = queryActionButtons(container);

    expect(readStatus(container)).toBe("Waiting for favorites to load");
    expect(download.disabled).toBe(true);
  });

  test("offers the current search results once enabled", () => {
    const { container, downloader } = setup();
    const [download] = queryActionButtons(container);

    downloader.enable();

    expect(download.disabled).toBe(false);
    expect(download.textContent).toBe("Download 2 Results");
  });

  test("picks up changed search results on a re-render", () => {
    const { container, downloader, results } = setup();
    const [download] = queryActionButtons(container);

    downloader.enable();
    results.pop();
    downloader.reRender();

    expect(download.textContent).toBe("Download 1 Result");
  });

  test("fetches every result's media and saves one zip when download is clicked", async() => {
    const { container, downloader, fetched, saved } = setup();
    const [download] = queryActionButtons(container);

    downloader.enable();
    download.click();
    await vi.waitFor(() => expect(readStatus(container)).toBe("Done: 2 downloaded"));

    expect(fetched.sort()).toEqual(["1/a.png", "1/b.png"]);
    expect(saved).toEqual(["favorites.zip"]);
  });

  test("aborts the download without saving when cancel is clicked", async() => {
    const { container, downloader, fetched, saved } = setup({ hang: true });
    const [download, cancel] = queryActionButtons(container);

    downloader.enable();
    download.click();
    await vi.waitFor(() => expect(fetched).toHaveLength(2));
    cancel.click();
    await vi.waitFor(() => expect(readStatus(container)).toBe("Cancelled: 0 downloaded"));

    expect(saved).toEqual([]);
  });
});
