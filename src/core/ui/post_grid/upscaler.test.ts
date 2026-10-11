import { describe, expect, onTestFinished, test, vi } from "vitest";
import { BitmapDecoder } from "@/core/boundary/ports/bitmap_decoder/bitmap_decoder";
import { Media } from "@/core/domain/media/media";
import { Upscaler } from "@/core/ui/post_grid/upscaler";
import { flushMicrotasks } from "@/testing/async";

const MEDIA: Media = { kind: "image", locator: "images/123" };

interface FakeBitmap {
  width: number;
  height: number;
  close: () => void;
}

interface Setup {
  upscaler: Upscaler;
  canvas: HTMLCanvasElement;
  fetchImage: ReturnType<typeof vi.fn<(media: Media, signal: AbortSignal) => Promise<Blob>>>;
  decode: ReturnType<typeof vi.fn<BitmapDecoder["decode"]>>;
  drawImage: ReturnType<typeof vi.fn>;
}

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(accept => {
    resolve = accept;
  });
  return { promise, resolve };
}

function setup(
  fetch: (media: Media, signal: AbortSignal) => Promise<Blob> = () => Promise.resolve(new Blob()),
  decode: BitmapDecoder["decode"] = () => Promise.resolve(createBitmap() as unknown as ImageBitmap)
): Setup {
  const canvas = document.createElement("canvas");

  canvas.hidden = true;
  const drawImage = vi.fn();
  const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext")
    .mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D);
  const fetchImage = vi.fn(fetch);
  const decodeBitmap = vi.fn(decode);
  const upscaler = new Upscaler({
    canvas,
    media: MEDIA,
    bitmapDecoder: { decode: decodeBitmap },
    fetchImage
  });

  onTestFinished(() => getContext.mockRestore());
  return { upscaler, canvas, fetchImage, decode: decodeBitmap, drawImage };
}

function createBitmap(): FakeBitmap {
  return { width: 640, height: 480, close: vi.fn() };
}

describe("Upscaler", () => {
  test("fetches and draws the image when upscaling is requested", async() => {
    const pendingFetch = deferred<Blob>();
    const bitmap = createBitmap();
    const { upscaler, canvas, fetchImage, decode, drawImage } = setup(() => pendingFetch.promise, () => Promise.resolve(bitmap as unknown as ImageBitmap));

    upscaler.upscale();
    expect(fetchImage).toHaveBeenCalledExactlyOnceWith(MEDIA, expect.any(AbortSignal));
    expect(canvas.hidden).toBe(true);

    pendingFetch.resolve(new Blob());
    await vi.waitFor(() => expect(drawImage).toHaveBeenCalledOnce());

    expect(decode).toHaveBeenCalledOnce();
    expect(drawImage).toHaveBeenCalledExactlyOnceWith(bitmap as unknown as ImageBitmap, 0, 0);
    expect([canvas.width, canvas.height, canvas.hidden]).toEqual([640, 480, false]);
    expect(bitmap.close).toHaveBeenCalledOnce();
  });

  test("does not start another request while one is in flight", () => {
    const pendingFetch = deferred<Blob>();
    const { upscaler, fetchImage } = setup(() => pendingFetch.promise);

    upscaler.upscale();
    upscaler.upscale();

    expect(fetchImage).toHaveBeenCalledOnce();
  });

  test("hides and shows a completed image without fetching it again", async() => {
    const { upscaler, canvas, fetchImage, drawImage } = setup();

    upscaler.upscale();
    await vi.waitFor(() => expect(drawImage).toHaveBeenCalledOnce());
    upscaler.disable();
    expect(canvas.hidden).toBe(true);

    upscaler.upscale();

    expect(canvas.hidden).toBe(false);
    expect(fetchImage).toHaveBeenCalledOnce();
  });

  test("logs a failed request and tries again on the next request", async() => {
    const error = new Error("offline");
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { upscaler, fetchImage, drawImage } = setup(() => Promise.reject(error));

    onTestFinished(() => log.mockRestore());
    upscaler.upscale();
    await vi.waitFor(() => expect(log).toHaveBeenCalledWith(error));
    fetchImage.mockResolvedValue(new Blob());
    upscaler.upscale();
    await vi.waitFor(() => expect(drawImage).toHaveBeenCalledOnce());
  });

  test("ignores the failure of a request it already aborted", async() => {
    let fail: (error: Error) => void = () => undefined;
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { upscaler } = setup(() => new Promise((_, reject) => {
      fail = reject;
    }));

    onTestFinished(() => log.mockRestore());
    upscaler.upscale();
    upscaler.dispose();
    fail(new Error("aborted"));
    await flushMicrotasks();
    expect(log).not.toHaveBeenCalled();
  });

  test("aborts an in-flight request when disabled", () => {
    const pendingFetch = deferred<Blob>();
    const { upscaler, fetchImage, canvas } = setup(() => pendingFetch.promise);

    upscaler.upscale();
    const signal = fetchImage.mock.calls[0][1];

    upscaler.disable();

    expect(signal.aborted).toBe(true);
    expect(canvas.hidden).toBe(true);
  });

  test("aborts a request and closes its bitmap if the result arrives later", async() => {
    const pendingFetch = deferred<Blob>();
    const pendingDecode = deferred<ImageBitmap>();
    const bitmap = createBitmap();
    const { upscaler, canvas, fetchImage, decode, drawImage } = setup(
      () => pendingFetch.promise,
      () => pendingDecode.promise
    );

    upscaler.upscale();
    const signal = fetchImage.mock.calls[0][1];

    upscaler.dispose();

    expect(signal.aborted).toBe(true);
    pendingFetch.resolve(new Blob());
    await vi.waitFor(() => expect(decode).toHaveBeenCalledOnce());
    pendingDecode.resolve(bitmap as unknown as ImageBitmap);
    await vi.waitFor(() => expect(bitmap.close).toHaveBeenCalledOnce());

    expect(drawImage).not.toHaveBeenCalled();
    expect(canvas.hidden).toBe(true);
  });
});
