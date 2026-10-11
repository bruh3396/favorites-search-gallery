import { describe, expect, onTestFinished, test, vi } from "vitest";
import { BitmapCache } from "@/core/ui/lightbox/stage/image/bitmap_cache";
import { BitmapDecoder } from "@/core/boundary/ports/bitmap_decoder/bitmap_decoder";
import { Media } from "@/core/domain/media/media";
import { MediaItem } from "@/core/domain/post/post";
import { flushMicrotasks } from "@/testing/async";

const FIRST: MediaItem = { id: "1", media: { kind: "image", locator: "images/1" } };
const SECOND: MediaItem = { id: "2", media: { kind: "image", locator: "images/2" } };
const FALLBACK_URL = "https://wimg.rule34.xxx/image";

interface FakeBitmap {
  close: () => void;
}

interface LoadedImage {
  image: HTMLImageElement;
  url: string;
}

// Settles each image as told the moment its source is set, since happy-dom loads no images.
function stubImageLoads(outcome: "load" | "error" | "pending"): { images: LoadedImage[] } {
  const images: LoadedImage[] = [];
  const setSource = vi.spyOn(HTMLImageElement.prototype, "src", "set").mockImplementation(function settleImage(this: HTMLImageElement, url: string) {
    images.push({ image: this, url });

    if (outcome !== "pending") {
      this.dispatchEvent(new Event(outcome));
    }
  });

  onTestFinished(() => setSource.mockRestore());
  return { images };
}

function setup(
  fetchOriginal: (media: Media, signal: AbortSignal) => Promise<Blob> = () => Promise.resolve(new Blob()),
  decodeResult: (source: ImageBitmapSource) => Promise<ImageBitmap> = () => Promise.resolve({ close: vi.fn() } as unknown as ImageBitmap),
  resolveOriginalImageFallbackUrl: (media: Media) => Promise<string> = () => Promise.resolve(FALLBACK_URL)
): {
  cache: BitmapCache;
  fetchOriginal: ReturnType<typeof vi.fn<(media: Media, signal: AbortSignal) => Promise<Blob>>>;
  decode: ReturnType<typeof vi.fn<(source: ImageBitmapSource) => Promise<ImageBitmap>>>;
  bitmaps: FakeBitmap[];
} {
  const fetch = vi.fn(fetchOriginal);
  const bitmaps: FakeBitmap[] = [];
  const decode = vi.fn<(source: ImageBitmapSource) => Promise<ImageBitmap>>(source => {
    return decodeResult(source).then(bitmap => {
      bitmaps.push(bitmap as unknown as FakeBitmap);
      return bitmap;
    });
  });

  const bitmapDecoder: BitmapDecoder = { decode };
  return {
    cache: new BitmapCache({ fetchOriginal: fetch, resolveOriginalImageFallbackUrl, bitmapDecoder }),
    fetchOriginal: fetch,
    decode,
    bitmaps
  };
}

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void; reject: (reason: Error) => void } {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((accept, fail) => {
    resolve = accept;
    reject = fail;
  });
  return { promise, resolve, reject };
}

describe("BitmapCache", () => {
  test("loads a bitmap once for each item and reuses it by id", async() => {
    const { cache, fetchOriginal, decode, bitmaps } = setup();

    expect(cache.has(FIRST.id)).toBe(false);
    const firstLoad = cache.load(FIRST);
    const repeatedLoad = cache.load({ ...FIRST, media: { kind: "image", locator: "images/other" } });

    expect(repeatedLoad).toBe(firstLoad);
    expect(cache.has(FIRST.id)).toBe(true);
    const bitmap = await firstLoad;

    expect(bitmap).toBe(bitmaps[0] as unknown as ImageBitmap);
    expect([fetchOriginal.mock.calls.length, decode.mock.calls.length]).toEqual([1, 1]);
  });

  test("removes items outside the kept set and closes their bitmaps", async() => {
    const { cache, bitmaps } = setup();
    const firstBitmap = await cache.load(FIRST);

    await cache.load(SECOND);

    cache.keepOnly([SECOND]);
    await Promise.resolve();

    expect([cache.has(FIRST.id), cache.has(SECOND.id)]).toEqual([false, true]);
    expect(bitmaps[0].close).toHaveBeenCalledOnce();
    expect(bitmaps[1].close).not.toHaveBeenCalled();
    expect(firstBitmap).toBe(bitmaps[0] as unknown as ImageBitmap);
  });

  test("returns undefined when a removed item fails to load", async() => {
    const pending = deferred<Blob>();
    const { cache, decode } = setup(() => pending.promise);
    const loading = cache.load(FIRST);

    await Promise.resolve();

    cache.keepOnly([]);
    pending.reject(new Error("aborted fetch"));

    await expect(loading).resolves.toBeUndefined();
    expect(decode).not.toHaveBeenCalled();
    expect(cache.has(FIRST.id)).toBe(false);
  });

  test("does not fetch when removed before its load starts", async() => {
    const { cache, fetchOriginal, decode } = setup();
    const loading = cache.load(FIRST);

    cache.keepOnly([]);

    await expect(loading).resolves.toBeUndefined();
    expect(fetchOriginal).not.toHaveBeenCalled();
    expect(decode).not.toHaveBeenCalled();
  });

  test("does not decode when removed after its fetch completes", async() => {
    const pending = deferred<Blob>();
    const { cache, fetchOriginal, decode } = setup(() => pending.promise);
    const loading = cache.load(FIRST);

    await Promise.resolve();

    cache.keepOnly([]);
    pending.resolve(new Blob());

    await expect(loading).resolves.toBeUndefined();
    expect(fetchOriginal.mock.calls[0][1].aborted).toBe(true);
    expect(decode).not.toHaveBeenCalled();
  });

  test("closes a bitmap when removed while decoding", async() => {
    const pending = deferred<ImageBitmap>();
    const bitmap = { close: vi.fn() } as unknown as ImageBitmap;
    const { cache, decode } = setup(undefined, () => pending.promise);
    const loading = cache.load(FIRST);

    await Promise.resolve();
    await Promise.resolve();

    cache.keepOnly([]);
    pending.resolve(bitmap);

    await expect(loading).resolves.toBeUndefined();
    expect(decode).toHaveBeenCalledOnce();
    expect(bitmap.close).toHaveBeenCalledOnce();
  });

  test("falls back to the fallback image when fetching the original fails", async() => {
    const { images } = stubImageLoads("load");
    const { cache, decode } = setup(() => Promise.reject(new Error("CORS")));

    await cache.load(FIRST);
    expect(images.map(image => image.url)).toEqual([FALLBACK_URL]);
    expect(decode).toHaveBeenCalledExactlyOnceWith(images[0].image);
  });

  test("goes straight to the fallback image for an item that needed it before", async() => {
    stubImageLoads("load");
    const { cache, fetchOriginal } = setup(() => Promise.reject(new Error("CORS")));

    await cache.load(FIRST);
    cache.keepOnly([]);
    await cache.load(FIRST);
    expect(fetchOriginal).toHaveBeenCalledOnce();
  });

  test("rejects and forgets an item whose fallback image fails too", async() => {
    stubImageLoads("error");
    const { cache } = setup(() => Promise.reject(new Error("CORS")));

    await expect(cache.load(FIRST)).rejects.toThrow(`Could not load original image: ${FALLBACK_URL}`);
    expect(cache.has(FIRST.id)).toBe(false);
  });

  test("rejects and forgets an item that fails to decode", async() => {
    const { cache } = setup(undefined, () => Promise.reject(new Error("EncodingError")));

    await expect(cache.load(FIRST)).rejects.toThrow("EncodingError");
    expect(cache.has(FIRST.id)).toBe(false);
  });

  test("stops loading the fallback image when removed", async() => {
    const { images } = stubImageLoads("pending");
    const { cache, decode } = setup(() => Promise.reject(new Error("CORS")));
    const loading = cache.load(FIRST);

    await vi.waitFor(() => expect(images).toHaveLength(1));
    cache.keepOnly([]);

    await expect(loading).resolves.toBeUndefined();
    expect(decode).not.toHaveBeenCalled();
  });

  test("doesn't start the fallback image when removed while its URL resolves", async() => {
    const { images } = stubImageLoads("load");
    const url = deferred<string>();
    const { cache, decode } = setup(() => Promise.reject(new Error("CORS")), undefined, () => url.promise);
    const loading = cache.load(FIRST);

    await flushMicrotasks();
    cache.keepOnly([]);
    url.resolve(FALLBACK_URL);

    await expect(loading).resolves.toBeUndefined();
    expect([images.length, decode.mock.calls.length]).toEqual([0, 0]);
  });

  test("keeps a newer entry when stale failure cleanup runs", async() => {
    const { cache } = setup();

    await cache.load(FIRST);
    const staleEntry = { bitmap: Promise.resolve(undefined), abortController: new AbortController() };
    const forget = (cache as unknown as { forget: (id: string, entry: typeof staleEntry) => void }).forget;

    forget.call(cache, FIRST.id, staleEntry);

    expect(cache.has(FIRST.id)).toBe(true);
  });
});
