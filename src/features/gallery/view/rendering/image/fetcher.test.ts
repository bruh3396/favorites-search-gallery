import { ImageRequest, LowResolutionImageRequest } from "@/features/gallery/types/image_request";
import { afterEach, describe, expect, test, vi } from "vitest";
import { GalleryImageFetcher } from "@/features/gallery/view/rendering/image/fetcher";
import { Media } from "@/core/domain/media/media";
import { PostMedia } from "@/core/domain/post/post";

const ITEM: PostMedia = { id: "7", media: { kind: "video", locator: "7" } };

function setup(failingUrl = ""): { fetcher: GalleryImageFetcher; loaded: string[] } {
  const loaded: string[] = [];

  vi.spyOn(HTMLImageElement.prototype, "src", "set").mockImplementation(function setSource(this: HTMLImageElement, url: string) {
    loaded.push(url);
    queueMicrotask(() => this.dispatchEvent(new Event(url === failingUrl ? "error" : "load")));
  });
  vi.stubGlobal("createImageBitmap", (image: HTMLImageElement) => Promise.resolve({ image } as unknown as ImageBitmap));
  const remoteMedia = {
    resolvePreviewUrl: (media: Media): Promise<string> => Promise.resolve(`preview/${media.locator}`),
    resolveImageUrl: (media: Media): Promise<string> => Promise.resolve(`image/${media.locator}`)
  };
  return { fetcher: new GalleryImageFetcher(remoteMedia), loaded };
}

describe("GalleryImageFetcher", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test("loads a high-resolution request from the media's image", async() => {
    const { fetcher, loaded } = setup();
    const request = new ImageRequest(ITEM);

    expect(await fetcher.fetchBitmap(request)).toBe(true);
    expect(loaded).toEqual(["image/7"]);
    expect(request.hasCompleted).toBe(true);
  });

  test("loads a low-resolution request from the media's preview", async() => {
    const { fetcher, loaded } = setup();
    const request = new LowResolutionImageRequest(new ImageRequest(ITEM));

    expect(await fetcher.fetchBitmap(request)).toBe(true);
    expect(loaded).toEqual(["preview/7"]);
  });

  test("gives up on a cancelled request", async() => {
    const { fetcher, loaded } = setup();
    const request = new ImageRequest(ITEM);

    request.cancel();
    expect(await fetcher.fetchBitmap(request)).toBe(false);
    expect(loaded).toEqual([]);
  });

  test("reports a preview that fails to load", async() => {
    const { fetcher } = setup("preview/7");
    const request = new LowResolutionImageRequest(new ImageRequest(ITEM));

    expect(await fetcher.fetchBitmap(request)).toBe(false);
    expect(request.hasCompleted).toBe(false);
  });
});
