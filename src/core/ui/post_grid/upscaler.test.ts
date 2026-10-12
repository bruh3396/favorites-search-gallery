import { UPSCALE_DELAY, Upscaler } from "@/core/ui/post_grid/upscaler";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { Media } from "@/core/domain/media/media";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { flushMicrotasks } from "@/testing/async";

const MEDIA: Media = { kind: "image", locator: "images/123" };

interface FakeBitmap {
  width: number;
  height: number;
  close: () => void;
}

type DecodeImage = (media: Media, signal: AbortSignal) => Promise<ImageBitmap>;

interface Setup {
  upscaler: Upscaler;
  scheduler: MemoryScheduler;
  canvas: HTMLCanvasElement;
  decodeImage: ReturnType<typeof vi.fn<DecodeImage>>;
  drawImage: ReturnType<typeof vi.fn>;
  upscaleNow: () => void;
}

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(accept => {
    resolve = accept;
  });
  return { promise, resolve };
}

function setup(decode: DecodeImage = () => Promise.resolve(createBitmap() as unknown as ImageBitmap)): Setup {
  const canvas = document.createElement("canvas");

  canvas.hidden = true;
  const drawImage = vi.fn();
  const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext")
    .mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D);
  const decodeImage = vi.fn(decode);
  const scheduler = new MemoryScheduler();
  const upscaler = new Upscaler({ canvas, media: MEDIA, decodeImage, scheduler });
  const upscaleNow = (): void => {
    upscaler.upscale();
    scheduler.advance(UPSCALE_DELAY);
  };

  onTestFinished(() => getContext.mockRestore());
  return { upscaler, scheduler, canvas, decodeImage, drawImage, upscaleNow };
}

function createBitmap(width = 640, height = 480): FakeBitmap {
  return { width, height, close: vi.fn() };
}

async function drawnSize(bitmap: FakeBitmap): Promise<number[]> {
  const { canvas, drawImage, upscaleNow } = setup(() => Promise.resolve(bitmap as unknown as ImageBitmap));

  upscaleNow();
  await vi.waitFor(() => expect(drawImage).toHaveBeenCalledOnce());
  expect(drawImage).toHaveBeenCalledWith(bitmap, 0, 0, canvas.width, canvas.height);
  return [canvas.width, canvas.height];
}

describe("Upscaler", () => {
  test("decodes and draws the image when upscaling is requested", async() => {
    const pendingDecode = deferred<ImageBitmap>();
    const bitmap = createBitmap();
    const { canvas, decodeImage, drawImage, upscaleNow } = setup(() => pendingDecode.promise);

    upscaleNow();
    expect(decodeImage).toHaveBeenCalledExactlyOnceWith(MEDIA, expect.any(AbortSignal));
    expect(canvas.hidden).toBe(true);

    pendingDecode.resolve(bitmap as unknown as ImageBitmap);
    await vi.waitFor(() => expect(drawImage).toHaveBeenCalledOnce());

    expect(drawImage).toHaveBeenCalledExactlyOnceWith(bitmap as unknown as ImageBitmap, 0, 0, 640, 480);
    expect([canvas.width, canvas.height, canvas.hidden]).toEqual([640, 480, false]);
    expect(bitmap.close).toHaveBeenCalledOnce();
  });

  test("waits for the tile to stay in view before decoding", () => {
    const { upscaler, scheduler, decodeImage } = setup();

    upscaler.upscale();
    upscaler.upscale();
    scheduler.advance(UPSCALE_DELAY - 1);
    expect(decodeImage).not.toHaveBeenCalled();
    scheduler.advance(1);
    expect(decodeImage).toHaveBeenCalledOnce();
  });

  test("never decodes a tile left before the delay passes", () => {
    const { upscaler, scheduler, decodeImage } = setup();

    upscaler.upscale();
    upscaler.dispose();
    scheduler.advance(UPSCALE_DELAY);
    expect(decodeImage).not.toHaveBeenCalled();
  });

  test("scales a wide image down to the maximum width", async() => {
    expect(await drawnSize(createBitmap(3_600, 2_400))).toEqual([700, 467]);
  });

  test("scales a tall image down to the maximum height", async() => {
    expect(await drawnSize(createBitmap(800, 32_000))).toEqual([400, 16_000]);
  });

  test("does not start another request while one is in flight", () => {
    const { decodeImage, upscaleNow } = setup(() => deferred<ImageBitmap>().promise);

    upscaleNow();
    upscaleNow();

    expect(decodeImage).toHaveBeenCalledOnce();
  });

  test("hides and shows a completed image without decoding it again", async() => {
    const { upscaler, canvas, decodeImage, drawImage, upscaleNow } = setup();

    upscaleNow();
    await vi.waitFor(() => expect(drawImage).toHaveBeenCalledOnce());
    upscaler.disable();
    expect(canvas.hidden).toBe(true);

    upscaler.upscale();

    expect(canvas.hidden).toBe(false);
    expect(decodeImage).toHaveBeenCalledOnce();
  });

  test("logs a failed request and tries again on the next request", async() => {
    const error = new Error("offline");
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { decodeImage, drawImage, upscaleNow } = setup(() => Promise.reject(error));

    onTestFinished(() => log.mockRestore());
    upscaleNow();
    await vi.waitFor(() => expect(log).toHaveBeenCalledWith(error));
    decodeImage.mockResolvedValue(createBitmap() as unknown as ImageBitmap);
    upscaleNow();
    await vi.waitFor(() => expect(drawImage).toHaveBeenCalledOnce());
  });

  test("ignores the failure of a request it already aborted", async() => {
    let fail: (error: Error) => void = () => undefined;
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { upscaler, upscaleNow } = setup(() => new Promise((_, reject) => {
      fail = reject;
    }));

    onTestFinished(() => log.mockRestore());
    upscaleNow();
    upscaler.dispose();
    fail(new Error("aborted"));
    await flushMicrotasks();
    expect(log).not.toHaveBeenCalled();
  });

  test("aborts an in-flight request when disabled", () => {
    const { upscaler, decodeImage, canvas, upscaleNow } = setup(() => deferred<ImageBitmap>().promise);

    upscaleNow();
    const signal = decodeImage.mock.calls[0][1];

    upscaler.disable();

    expect(signal.aborted).toBe(true);
    expect(canvas.hidden).toBe(true);
  });

  test("aborts a request and closes its bitmap if the result arrives later", async() => {
    const pendingDecode = deferred<ImageBitmap>();
    const bitmap = createBitmap();
    const { upscaler, canvas, decodeImage, drawImage, upscaleNow } = setup(() => pendingDecode.promise);

    upscaleNow();
    const signal = decodeImage.mock.calls[0][1];

    upscaler.dispose();

    expect(signal.aborted).toBe(true);
    pendingDecode.resolve(bitmap as unknown as ImageBitmap);
    await vi.waitFor(() => expect(bitmap.close).toHaveBeenCalledOnce());

    expect(drawImage).not.toHaveBeenCalled();
    expect(canvas.hidden).toBe(true);
  });
});
