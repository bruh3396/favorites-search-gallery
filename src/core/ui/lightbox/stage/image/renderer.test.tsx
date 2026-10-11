import { ImageRenderer, ImageRendererDependencies } from "@/core/ui/lightbox/stage/image/renderer";
import { Mock, describe, expect, onTestFinished, test, vi } from "vitest";
import { BitmapDecoder } from "@/core/boundary/ports/bitmap_decoder/bitmap_decoder";
import { LightboxRendererClass } from "@/core/ui/lightbox/stage/renderer";
import { MediaItem } from "@/core/domain/post/post";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { render } from "@/core/ui/h/h";

const FIRST: MediaItem = { id: "1", media: { kind: "image", locator: "images/1" } };
const SECOND: MediaItem = { id: "2", media: { kind: "image", locator: "images/2" } };
const THIRD: MediaItem = { id: "3", media: { kind: "image", locator: "images/3" } };

interface FakeBitmap {
  width: number;
  height: number;
  locator: string;
  close: Mock<() => void>;
}

interface Setup {
  renderer: ImageRenderer;
  preview: HTMLImageElement;
  original: HTMLCanvasElement;
  scheduler: MemoryScheduler;
  resolvePreviewUrl: Mock<ImageRendererDependencies["resolvePreviewUrl"]>;
  fetchOriginal: Mock<ImageRendererDependencies["fetchOriginal"]>;
  decode: Mock<BitmapDecoder["decode"]>;
  drawImage: Mock<(bitmap: FakeBitmap) => void>;
  bitmaps: FakeBitmap[];
}

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(accept => {
    resolve = accept;
  });
  return { promise, resolve };
}

function setup(
  fetch: ImageRendererDependencies["fetchOriginal"] = media => Promise.resolve(Object.assign(new Blob(), { locator: media.locator })),
  previewUrl: ImageRendererDependencies["resolvePreviewUrl"] = media => Promise.resolve(`https://preview/${media.locator}`),
  context: "available" | "missing" = "available"
): Setup {
  const scheduler = new MemoryScheduler();
  const resolvePreviewUrl = vi.fn(previewUrl);
  const fetchOriginal = vi.fn(fetch);
  const bitmaps: FakeBitmap[] = [];
  const decode = vi.fn<BitmapDecoder["decode"]>(source => {
    const bitmap = { width: 320, height: 240, locator: (source as Blob & { locator: string }).locator, close: vi.fn() };

    bitmaps.push(bitmap);
    return Promise.resolve(bitmap as unknown as ImageBitmap);
  });
  const drawImage = vi.fn<(bitmap: FakeBitmap) => void>();
  const drawingContext = context === "available" ? { drawImage } as unknown as CanvasRenderingContext2D : null;
  const spy = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(drawingContext);

  onTestFinished(() => spy.mockRestore());
  const resolveOriginalImageFallbackUrl = vi.fn<ImageRendererDependencies["resolveOriginalImageFallbackUrl"]>(media => Promise.resolve(`https://wimg.rule34.xxx/${media.locator}`));
  const { result: renderer } = render(document, () => new ImageRenderer({
    resolvePreviewUrl,
    resolveOriginalImageFallbackUrl,
    fetchOriginal,
    bitmapDecoder: { decode },
    scheduler
  }));
  const preview = renderer.root.querySelector<HTMLImageElement>("img")!;
  const original = renderer.root.querySelector<HTMLCanvasElement>("canvas")!;
  return { renderer, preview, original, scheduler, resolvePreviewUrl, fetchOriginal, decode, drawImage, bitmaps };
}

describe("ImageRenderer", () => {
  test("starts hidden with its image and canvas in the stage root", () => {
    const { renderer, preview, original } = setup();

    expect(renderer.root.className).toBe(LightboxRendererClass.root);
    expect([preview.className, original.className]).toEqual([LightboxRendererClass.media, LightboxRendererClass.media]);
    expect([preview.alt, preview.decoding]).toEqual(["", "async"]);
    expect([renderer.root.hidden, preview.hidden, original.hidden, original.width, original.height]).toEqual([true, true, true, 0, 0]);
  });

  test("shows a resolved preview while the original is pending", async() => {
    const { renderer, preview, original, resolvePreviewUrl } = setup(() => new Promise(() => undefined));

    renderer.show(FIRST);
    expect(renderer.root.hidden).toBe(false);
    expect(preview.hasAttribute("src")).toBe(false);
    expect(preview.hidden).toBe(false);
    expect(original.hidden).toBe(true);
    await vi.waitFor(() => expect(preview.getAttribute("src")).toBe("https://preview/images/1"));
    expect(resolvePreviewUrl).toHaveBeenCalledWith(FIRST.media);
  });

  test("draws the original and keeps it visible when the preview resolves later", async() => {
    const pending = deferred<string>();
    const { renderer, preview, original, drawImage, bitmaps } = setup(undefined, () => pending.promise);

    renderer.show(FIRST);
    await vi.waitFor(() => expect(drawImage).toHaveBeenCalledOnce());
    expect(drawImage).toHaveBeenCalledWith(bitmaps[0], 0, 0);
    expect([original.width, original.height]).toEqual([320, 240]);
    expect([preview.hidden, original.hidden]).toEqual([true, false]);
    pending.resolve("https://preview/late");
    await vi.waitFor(() => expect(preview.getAttribute("src")).toBe("https://preview/late"));
    expect([preview.hidden, original.hidden]).toEqual([true, false]);
  });

  test("draws a bitmap even when the canvas has no drawing context", async() => {
    const { renderer, original } = setup(undefined, undefined, "missing");

    renderer.show(FIRST);
    await vi.waitFor(() => expect(original.width).toBe(320));
    expect([original.height, original.hidden]).toEqual([240, false]);
  });

  test("does not replace the current preview with a stale result", async() => {
    const pending = deferred<string>();
    const { renderer, preview } = setup(() => new Promise(() => undefined), media => (media.locator === FIRST.media.locator ? pending.promise : Promise.resolve("https://preview/second")));

    renderer.show(FIRST);
    await vi.waitFor(() => expect(preview.hidden).toBe(false));
    renderer.show(SECOND);
    await vi.waitFor(() => expect(preview.getAttribute("src")).toBe("https://preview/second"));
    pending.resolve("https://preview/stale");
    await Promise.resolve();
    expect(preview.getAttribute("src")).toBe("https://preview/second");
  });

  test("keeps the preview visible when the original fails", async() => {
    const { renderer, preview, original } = setup(() => Promise.reject(new Error("offline")));

    renderer.show(FIRST);
    await vi.waitFor(() => expect(preview.getAttribute("src")).toBe("https://preview/images/1"));
    expect([preview.hidden, original.hidden]).toEqual([false, true]);
  });

  test("waits for quick navigation to settle before loading the next original", async() => {
    const { renderer, scheduler, fetchOriginal } = setup(() => new Promise(() => undefined));

    renderer.show(FIRST);
    await vi.waitFor(() => expect(fetchOriginal).toHaveBeenCalledOnce());
    renderer.show(SECOND);
    scheduler.advance(199);
    expect(fetchOriginal).toHaveBeenCalledOnce();
    scheduler.advance(1);
    await vi.waitFor(() => expect(fetchOriginal).toHaveBeenCalledTimes(2));
    expect(fetchOriginal.mock.calls.map(([media]) => media)).toEqual([FIRST.media, SECOND.media]);
  });

  test("preloads neighbors and reuses a cached bitmap when shown", async() => {
    const { renderer, scheduler, fetchOriginal, drawImage } = setup();

    renderer.setNeighbors([SECOND]);
    scheduler.advance(200);
    await vi.waitFor(() => expect(fetchOriginal).toHaveBeenCalledOnce());
    await vi.waitFor(() => expect(drawImage).not.toHaveBeenCalled());
    renderer.show(SECOND);
    await vi.waitFor(() => expect(drawImage).toHaveBeenCalledOnce());
    expect(fetchOriginal).toHaveBeenCalledOnce();
  });

  test("retains current and neighbor bitmaps and releases removed neighbors", async() => {
    const { renderer, scheduler, bitmaps } = setup();

    renderer.show(FIRST);
    renderer.setNeighbors([SECOND]);
    scheduler.advance(200);
    await vi.waitFor(() => expect(bitmaps).toHaveLength(2));
    await vi.waitFor(() => expect(bitmaps.some(bitmap => bitmap.locator === SECOND.media.locator)).toBe(true));
    renderer.setNeighbors([THIRD]);
    const firstBitmap = bitmaps.find(bitmap => bitmap.locator === FIRST.media.locator)!;
    const secondBitmap = bitmaps.find(bitmap => bitmap.locator === SECOND.media.locator)!;

    await vi.waitFor(() => expect(secondBitmap.close).toHaveBeenCalledOnce());
    expect(firstBitmap.close).not.toHaveBeenCalled();
    renderer.clear();
    await vi.waitFor(() => expect(firstBitmap.close).toHaveBeenCalledOnce());
  });

  test("clears the image and canvas and cancels a pending original", async() => {
    const { renderer, preview, original, scheduler, fetchOriginal, bitmaps } = setup();

    renderer.show(FIRST);
    await vi.waitFor(() => expect(bitmaps).toHaveLength(1));
    renderer.show(SECOND);
    renderer.clear();
    scheduler.advance(200);
    expect(fetchOriginal).toHaveBeenCalledOnce();
    expect([renderer.root.hidden, preview.hidden, original.hidden]).toEqual([true, true, true]);
    expect(preview.hasAttribute("src")).toBe(false);
    expect([original.width, original.height]).toEqual([0, 0]);
    await vi.waitFor(() => expect(bitmaps[0].close).toHaveBeenCalledOnce());
  });

  test("disposes pending preloads and releases the current bitmap", async() => {
    const { renderer, scheduler, fetchOriginal, bitmaps, preview, original } = setup();

    renderer.show(FIRST);
    await vi.waitFor(() => expect(bitmaps).toHaveLength(1));
    renderer.setNeighbors([SECOND]);
    renderer.dispose();
    scheduler.advance(200);
    expect(fetchOriginal).toHaveBeenCalledOnce();
    await vi.waitFor(() => expect(bitmaps[0].close).toHaveBeenCalledOnce());
    expect([renderer.root.hidden, preview.hidden, original.hidden]).toEqual([true, true, true]);
  });
});
