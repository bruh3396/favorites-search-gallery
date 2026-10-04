import { ImageRequest, LowResolutionImageRequest } from "@/features/gallery/types/image_request";
import { afterEach, describe, expect, test, vi } from "vitest";
import { GalleryImageFetcher } from "@/features/gallery/view/rendering/image/fetcher";
import { Media } from "@/core/domain/media/media";
import { PostMedia } from "@/core/domain/post/post";

const ITEM: PostMedia = { id: "7", media: { kind: "video", locator: "7" } };
const IMAGE = new Blob(["image"]);

interface Setup {
  fetcher: GalleryImageFetcher;
  loaded: string[];
  fetched: { media: Media; signal?: AbortSignal }[];
  decoded: unknown[];
}

function setup({ failingUrl = "", imageError = null }: { failingUrl?: string; imageError?: Error | null } = {}): Setup {
  const loaded: string[] = [];
  const fetched: { media: Media; signal?: AbortSignal }[] = [];
  const decoded: unknown[] = [];

  vi.spyOn(HTMLImageElement.prototype, "src", "set").mockImplementation(function setSource(this: HTMLImageElement, url: string) {
    loaded.push(url);
    queueMicrotask(() => this.dispatchEvent(new Event(url === failingUrl ? "error" : "load")));
  });
  vi.stubGlobal("createImageBitmap", (source: unknown) => {
    decoded.push(source);
    return Promise.resolve({ source } as unknown as ImageBitmap);
  });
  const remoteMedia = {
    resolvePreviewUrl: (media: Media): Promise<string> => Promise.resolve(`preview/${media.locator}`),
    fetchImage: (media: Media, signal?: AbortSignal): Promise<Blob> => {
      fetched.push({ media, signal });
      return imageError === null ? Promise.resolve(IMAGE) : Promise.reject(imageError);
    }
  };
  return { fetcher: new GalleryImageFetcher(remoteMedia), loaded, fetched, decoded };
}

describe("GalleryImageFetcher", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test("decodes a high-resolution request from the media's fetched image", async() => {
    const { fetcher, fetched, decoded } = setup();
    const request = new ImageRequest(ITEM);

    expect(await fetcher.fetchBitmap(request)).toBe(true);
    expect(fetched).toEqual([{ media: ITEM.media, signal: request.abortController.signal }]);
    expect(decoded).toEqual([IMAGE]);
    expect(request.hasCompleted).toBe(true);
  });

  test("loads a low-resolution request from the media's preview", async() => {
    const { fetcher, loaded, fetched } = setup();
    const request = new LowResolutionImageRequest(new ImageRequest(ITEM));

    expect(await fetcher.fetchBitmap(request)).toBe(true);
    expect(loaded).toEqual(["preview/7"]);
    expect(fetched).toEqual([]);
  });

  test("gives up on a cancelled request", async() => {
    const { fetcher, fetched } = setup();
    const request = new ImageRequest(ITEM);

    request.cancel();
    expect(await fetcher.fetchBitmap(request)).toBe(false);
    expect(fetched).toEqual([]);
  });

  test("gives up on an aborted image fetch", async() => {
    const { fetcher } = setup({ imageError: new DOMException("aborted", "AbortError") });
    const request = new ImageRequest(ITEM);

    expect(await fetcher.fetchBitmap(request)).toBe(false);
    expect(request.hasCompleted).toBe(false);
  });

  test("rethrows an image fetch that fails", async() => {
    const { fetcher } = setup({ imageError: new Error("404") });

    await expect(fetcher.fetchBitmap(new ImageRequest(ITEM))).rejects.toThrow("404");
  });

  test("reports a preview that fails to load", async() => {
    const { fetcher } = setup({ failingUrl: "preview/7" });
    const request = new LowResolutionImageRequest(new ImageRequest(ITEM));

    expect(await fetcher.fetchBitmap(request)).toBe(false);
    expect(request.hasCompleted).toBe(false);
  });
});
