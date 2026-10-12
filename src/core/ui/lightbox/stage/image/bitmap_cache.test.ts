import { describe, expect, test, vi } from "vitest";
import { BitmapCache } from "@/core/ui/lightbox/stage/image/bitmap_cache";
import { Media } from "@/core/domain/media/media";
import { MediaItem } from "@/core/domain/post/post";

const FIRST: MediaItem = { id: "1", media: { kind: "image", locator: "images/1" } };
const SECOND: MediaItem = { id: "2", media: { kind: "image", locator: "images/2" } };

interface FakeBitmap {
  close: () => void;
}

type DecodeOriginal = (media: Media, signal: AbortSignal) => Promise<ImageBitmap>;

function setup(decodeResult: DecodeOriginal = () => Promise.resolve({ close: vi.fn() } as unknown as ImageBitmap)): {
  cache: BitmapCache;
  decodeOriginal: ReturnType<typeof vi.fn<DecodeOriginal>>;
  bitmaps: FakeBitmap[];
} {
  const bitmaps: FakeBitmap[] = [];
  const decodeOriginal = vi.fn<DecodeOriginal>((media, signal) => {
    return decodeResult(media, signal).then(bitmap => {
      bitmaps.push(bitmap as unknown as FakeBitmap);
      return bitmap;
    });
  });
  return { cache: new BitmapCache({ decodeOriginal }), decodeOriginal, bitmaps };
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
    const { cache, decodeOriginal, bitmaps } = setup();

    expect(cache.has(FIRST.id)).toBe(false);
    const firstLoad = cache.load(FIRST);
    const repeatedLoad = cache.load({ ...FIRST, media: { kind: "image", locator: "images/other" } });

    expect(repeatedLoad).toBe(firstLoad);
    expect(cache.has(FIRST.id)).toBe(true);
    const bitmap = await firstLoad;

    expect(bitmap).toBe(bitmaps[0] as unknown as ImageBitmap);
    expect(decodeOriginal).toHaveBeenCalledExactlyOnceWith(FIRST.media, expect.any(AbortSignal));
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
    const pending = deferred<ImageBitmap>();
    const { cache, decodeOriginal } = setup(() => pending.promise);
    const loading = cache.load(FIRST);

    await Promise.resolve();

    cache.keepOnly([]);
    pending.reject(new Error("aborted fetch"));

    await expect(loading).resolves.toBeUndefined();
    expect(decodeOriginal.mock.calls[0][1].aborted).toBe(true);
    expect(cache.has(FIRST.id)).toBe(false);
  });

  test("does not decode when removed before its load starts", async() => {
    const { cache, decodeOriginal } = setup();
    const loading = cache.load(FIRST);

    cache.keepOnly([]);

    await expect(loading).resolves.toBeUndefined();
    expect(decodeOriginal).not.toHaveBeenCalled();
  });

  test("closes a bitmap when removed while decoding", async() => {
    const pending = deferred<ImageBitmap>();
    const bitmap = { close: vi.fn() } as unknown as ImageBitmap;
    const { cache, decodeOriginal } = setup(() => pending.promise);
    const loading = cache.load(FIRST);

    await Promise.resolve();
    await Promise.resolve();

    cache.keepOnly([]);
    pending.resolve(bitmap);

    await expect(loading).resolves.toBeUndefined();
    expect(decodeOriginal).toHaveBeenCalledOnce();
    expect(bitmap.close).toHaveBeenCalledOnce();
  });

  test("rejects and forgets an item that fails to decode", async() => {
    const { cache } = setup(() => Promise.reject(new Error("EncodingError")));

    await expect(cache.load(FIRST)).rejects.toThrow("EncodingError");
    expect(cache.has(FIRST.id)).toBe(false);
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
