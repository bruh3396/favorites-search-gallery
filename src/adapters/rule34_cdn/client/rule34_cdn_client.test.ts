import { describe, expect, test, vi } from "vitest";
import { Media } from "@/core/domain/media/media";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { Rule34CdnClient } from "@/adapters/rule34_cdn/client/rule34_cdn_client";
import { advanceAndSettle } from "@/testing/async";

type Fetch = (url: string, init?: RequestInit) => Promise<Response>;
type FetchMock = ReturnType<typeof vi.fn<Fetch>>;
type DecodeBitmap = (source: ImageBitmapSource, options?: ImageBitmapOptions) => Promise<ImageBitmap>;
type LoadImage = (url: string, signal?: AbortSignal) => Promise<HTMLImageElement>;

const BITMAP = { close: (): void => undefined } as ImageBitmap;
const GIF_ORIGINAL = "https://rule34.xxx/images//1234/a1b2c3.gif";
const GIF_ON_WIMG = "https://wimg.rule34.xxx/images//1234/a1b2c3.gif";

function respondWithBytes(): Promise<Response> {
  return Promise.resolve(new Response("bytes"));
}

function rejectEveryImage(): Promise<HTMLImageElement> {
  return Promise.reject(new Error("Could not load image"));
}

interface Setup {
  rule34CdnClient: Rule34CdnClient;
  fetch: FetchMock;
  scheduler: MemoryScheduler;
  decodeBitmap: ReturnType<typeof vi.fn<DecodeBitmap>>;
  loadImage: ReturnType<typeof vi.fn<LoadImage>>;
}

function setup(respond: Fetch = respondWithBytes, load: LoadImage = rejectEveryImage): Setup {
  const fetch = vi.fn<Fetch>(respond);
  const scheduler = new MemoryScheduler();
  const decodeBitmap = vi.fn<DecodeBitmap>(() => Promise.resolve(BITMAP));
  const loadImage = vi.fn<LoadImage>(load);
  const rule34CdnClient = new Rule34CdnClient({ fetch, scheduler, loadImage, decodeBitmap });
  return { rule34CdnClient, fetch, scheduler, decodeBitmap, loadImage };
}

function createDecodableImage(): HTMLImageElement {
  return Object.assign(document.createElement("img"), { decode: vi.fn(() => Promise.resolve()) });
}

function createLoadFindingOnly(okUrl: string, image: HTMLImageElement): LoadImage {
  return (url: string): Promise<HTMLImageElement> => (url === okUrl ? Promise.resolve(image) : rejectEveryImage());
}

async function settled<T>(scheduler: MemoryScheduler, pending: Promise<T>): Promise<T> {
  await advanceAndSettle(scheduler, 1_000);
  return pending;
}

function createFetchFindingOnly(okUrl: string): Fetch {
  return (url: string): Promise<Response> => Promise.resolve(new Response(null, { status: url === okUrl ? 200 : 404 }));
}

function media(kind: Media["kind"], locator: string): Media {
  return { kind, locator };
}

describe("Rule34CdnClient", () => {
  test("mints media from a file url", () => {
    expect(setup().rule34CdnClient.mintMediaFromUrl({ url: "https://api-cdn.rule34.xxx/images/1234/a1b2c3.mp4", tags: "" }))
      .toEqual({ kind: "video", locator: "1234/a1b2c3.mp4" });
  });

  test("mints nothing from a url that isn't a Rule34 file", () => {
    expect(setup().rule34CdnClient.mintMediaFromUrl({ url: "https://example.com/a.png", tags: "" })).toBeNull();
  });

  test("mints media from a file's parts", () => {
    expect(setup().rule34CdnClient.mintMediaFromParts({ directory: 1234, stem: "a1b2c3", extension: "mp4", tags: "" }))
      .toEqual({ kind: "video", locator: "1234/a1b2c3.mp4" });
  });

  test("leaves an unknown extension off the parts' locator, guessing the kind from the tags", () => {
    expect(setup().rule34CdnClient.mintMediaFromParts({ directory: 1234, stem: "a1b2c3", extension: "webm", tags: "video" }))
      .toEqual({ kind: "video", locator: "1234/a1b2c3" });
  });

  test("resolves media with an extension without asking the host", async() => {
    const { rule34CdnClient, fetch } = setup();
    const knownMedia = media("image", "1234/a1b2c3.png");

    expect(await rule34CdnClient.resolveMedia(knownMedia)).toBe(knownMedia);
    expect(fetch).not.toHaveBeenCalled();
  });

  test("keeps the tag guess for media without an extension, without asking the host", async() => {
    const { rule34CdnClient, fetch } = setup(createFetchFindingOnly("https://rule34.xxx/images//1234/a1b2c3.jpg"));
    const guessedMedia = media("video", "1234/a1b2c3");

    expect(await rule34CdnClient.resolveMedia(guessedMedia)).toBe(guessedMedia);
    expect(fetch).not.toHaveBeenCalled();
  });

  test("addresses a preview on the thumbnail host", () => {
    expect(setup().rule34CdnClient.previewUrl(media("image", "1234/a1b2c3")))
      .toBe("https://wimg.rule34.xxx/thumbnails//1234/thumbnail_a1b2c3.jpg");
  });

  test("addresses an original by the extension its locator carries", async() => {
    const { rule34CdnClient, fetch } = setup();

    expect(await rule34CdnClient.originalUrl(media("gif", "1234/a1b2c3.png"))).toBe("https://rule34.xxx/images//1234/a1b2c3.png");
    expect(fetch).not.toHaveBeenCalled();
  });

  test("addresses videos and gifs by their kind", async() => {
    const { rule34CdnClient } = setup();

    expect(await rule34CdnClient.originalUrl(media("video", "1234/a1b2c3"))).toBe("https://rule34.xxx/images//1234/a1b2c3.mp4");
    expect(await rule34CdnClient.originalUrl(media("gif", "1234/a1b2c3"))).toBe("https://rule34.xxx/images//1234/a1b2c3.gif");
  });

  test("addresses a video's still as the jpg beside it", async() => {
    const { rule34CdnClient, fetch } = setup();

    expect(await rule34CdnClient.stillUrl(media("video", "1234/a1b2c3.mp4"))).toBe("https://rule34.xxx/images//1234/a1b2c3.jpg");
    expect(fetch).not.toHaveBeenCalled();
  });

  test("addresses an image's or gif's still as its original", async() => {
    const { rule34CdnClient } = setup();

    expect(await rule34CdnClient.stillUrl(media("image", "1234/a1b2c3.png"))).toBe("https://rule34.xxx/images//1234/a1b2c3.png");
    expect(await rule34CdnClient.stillUrl(media("gif", "1234/a1b2c3"))).toBe(GIF_ORIGINAL);
  });

  test("probes an image's extension once", async() => {
    const { rule34CdnClient, fetch, scheduler } = setup(createFetchFindingOnly("https://rule34.xxx/images//1234/a1b2c3.png"));
    const original = "https://rule34.xxx/images//1234/a1b2c3.png";

    expect(await settled(scheduler, rule34CdnClient.originalUrl(media("image", "1234/a1b2c3")))).toBe(original);
    expect(await settled(scheduler, rule34CdnClient.originalUrl(media("image", "1234/a1b2c3")))).toBe(original);
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      "https://rule34.xxx/images//1234/a1b2c3.jpeg",
      "https://rule34.xxx/images//1234/a1b2c3.png"
    ]);
  });

  test("falls back to jpg when no probe finds the image", async() => {
    const { rule34CdnClient, scheduler } = setup(createFetchFindingOnly(""));

    expect(await settled(scheduler, rule34CdnClient.originalUrl(media("image", "1234/a1b2c3"))))
      .toBe("https://rule34.xxx/images//1234/a1b2c3.jpg");
  });

  test("treats a probe the network fails as a miss", async() => {
    const { rule34CdnClient, scheduler } = setup(() => Promise.reject(new TypeError("offline")));

    expect(await settled(scheduler, rule34CdnClient.originalUrl(media("image", "1234/a1b2c3"))))
      .toBe("https://rule34.xxx/images//1234/a1b2c3.jpg");
  });

  test("rejects a video duration the host won't serve", async() => {
    const { rule34CdnClient, scheduler } = setup(createFetchFindingOnly(""));
    const duration = rule34CdnClient.probeDurationSeconds(media("video", "1234/a1b2c3"));

    duration.catch(() => { });
    await expect(settled(scheduler, duration)).rejects.toThrow("Unable to probe video duration: https://rule34.xxx/images//1234/a1b2c3.mp4");
  });

  test("decodes a still at full size without a width", async() => {
    const { rule34CdnClient, fetch, decodeBitmap } = setup();
    const signal = new AbortController().signal;

    expect(await rule34CdnClient.decodeStill(media("image", "1234/a1b2c3.png"), signal)).toBe(BITMAP);
    expect(fetch).toHaveBeenCalledExactlyOnceWith("https://rule34.xxx/images//1234/a1b2c3.png", { signal });
    expect(decodeBitmap).toHaveBeenCalledExactlyOnceWith(expect.any(Blob), undefined);
  });

  test("fetches an original's file", async() => {
    const { rule34CdnClient, fetch } = setup();

    expect(await (await rule34CdnClient.fetchOriginal(media("video", "1234/a1b2c3"))).text()).toBe("bytes");
    expect(fetch).toHaveBeenCalledExactlyOnceWith("https://rule34.xxx/images//1234/a1b2c3.mp4");
  });

  test("rejects an original the host won't serve", async() => {
    const { rule34CdnClient } = setup(createFetchFindingOnly(""));

    await expect(rule34CdnClient.fetchOriginal(media("video", "1234/a1b2c3"))).rejects.toThrow("https://rule34.xxx/images//1234/a1b2c3.mp4 answered 404");
  });

  test("decodes a video's still from the jpg beside it", async() => {
    const { rule34CdnClient, fetch } = setup();

    expect(await rule34CdnClient.decodeStill(media("video", "1234/a1b2c3"), undefined, 500)).toBe(BITMAP);
    expect(fetch).toHaveBeenCalledExactlyOnceWith("https://rule34.xxx/images//1234/a1b2c3.jpg", { signal: undefined });
  });

  test("decodes a still already scaled to the width asked for", async() => {
    const { rule34CdnClient, decodeBitmap } = setup();

    await rule34CdnClient.decodeStill(media("image", "1234/a1b2c3.png"), undefined, 500);
    expect(decodeBitmap).toHaveBeenCalledExactlyOnceWith(expect.any(Blob), { resizeWidth: 500, resizeQuality: "high" });
  });

  test("loads an original from its host, decoded", async() => {
    const image = createDecodableImage();
    const { rule34CdnClient, loadImage } = setup(respondWithBytes, createLoadFindingOnly(GIF_ORIGINAL, image));
    const signal = new AbortController().signal;

    expect(await rule34CdnClient.loadOriginal(media("gif", "1234/a1b2c3"), signal)).toBe(image);
    expect(loadImage).toHaveBeenCalledExactlyOnceWith(GIF_ORIGINAL, signal);
    expect(image.decode).toHaveBeenCalledOnce();
  });

  test("loads an original from WIMG when its host fails", async() => {
    const image = createDecodableImage();
    const { rule34CdnClient, loadImage } = setup(respondWithBytes, createLoadFindingOnly(GIF_ON_WIMG, image));

    expect(await rule34CdnClient.loadOriginal(media("gif", "1234/a1b2c3"))).toBe(image);
    expect(loadImage.mock.calls.map(([url]) => url)).toEqual([GIF_ORIGINAL, GIF_ON_WIMG]);
  });

  test("rejects an aborted original without trying WIMG", async() => {
    const controller = new AbortController();
    const { rule34CdnClient, loadImage } = setup(respondWithBytes, () => {
      controller.abort();
      return rejectEveryImage();
    });

    await expect(rule34CdnClient.loadOriginal(media("gif", "1234/a1b2c3"), controller.signal)).rejects.toThrow("Could not load image");
    expect(loadImage).toHaveBeenCalledOnce();
  });
});
