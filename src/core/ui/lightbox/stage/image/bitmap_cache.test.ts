import { describe, expect, test, vi } from "vitest";
import { BitmapCache } from "@/core/ui/lightbox/stage/image/bitmap_cache";
import { BitmapDecoder } from "@/core/boundary/ports/bitmap_decoder/bitmap_decoder";
import { Media } from "@/core/domain/media/media";
import { MediaItem } from "@/core/domain/media/media";

const FIRST: MediaItem = { id: "1", media: { kind: "image", locator: "images/1" } };
const SECOND: MediaItem = { id: "2", media: { kind: "image", locator: "images/2" } };

interface FakeBitmap {
  close: () => void;
}

function setup(fetchOriginal: (media: Media, signal: AbortSignal) => Promise<Blob> = () => Promise.resolve(new Blob()), decodeResult: (source: ImageBitmapSource) => Promise<ImageBitmap> = () => Promise.resolve({ close: vi.fn() } as unknown as ImageBitmap)): {
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
    cache: new BitmapCache({ fetchOriginal: fetch, resolveOriginalImageFallbackUrl: () => Promise.resolve("https://wimg.rule34.xxx/image"), bitmapDecoder }),
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

  test("keeps a newer entry when stale failure cleanup runs", async() => {
    const { cache } = setup();

    await cache.load(FIRST);
    const staleEntry = { bitmap: Promise.resolve(undefined), abortController: new AbortController() };
    const forget = (cache as unknown as { forget: (id: string, entry: typeof staleEntry) => void }).forget;

    forget.call(cache, FIRST.id, staleEntry);

    expect(cache.has(FIRST.id)).toBe(true);
  });
});
