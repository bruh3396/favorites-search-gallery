import { MAX_CANVAS_HEIGHT, MAX_CANVAS_WIDTH, Upscaler } from "@/core/ui/post_grid/upscaler";
import { UPSCALE_PACER_CONFIGURATION, UpscalePacer } from "@/core/ui/post_grid/upscale_pacer";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { Media } from "@/core/domain/media/media";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { flushMicrotasks } from "@/testing/async";

const MEDIA: Media = { kind: "image", locator: "images/123" };
const QUIET_PERIOD = UPSCALE_PACER_CONFIGURATION.quietPeriod;

interface FakeBitmap {
  width: number;
  height: number;
  close: () => void;
}

type DecodeStill = (media: Media, signal: AbortSignal, width: number) => Promise<ImageBitmap>;

interface Setup {
  upscaler: Upscaler;
  scheduler: MemoryScheduler;
  canvas: HTMLCanvasElement;
  decodeStill: ReturnType<typeof vi.fn<DecodeStill>>;
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

function setup(decode: DecodeStill = () => Promise.resolve(createBitmap() as unknown as ImageBitmap)): Setup {
  const canvas = document.createElement("canvas");

  canvas.hidden = true;
  const drawImage = vi.fn();
  const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext")
    .mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D);
  const decodeStill = vi.fn(decode);
  const scheduler = new MemoryScheduler();
  const upscaler = new Upscaler({ canvas, media: MEDIA, decodeStill, upscalePacer: new UpscalePacer(UPSCALE_PACER_CONFIGURATION, scheduler) });
  const upscaleNow = (): void => {
    upscaler.upscale();
    scheduler.advance(QUIET_PERIOD);
  };

  onTestFinished(() => getContext.mockRestore());
  return { upscaler, scheduler, canvas, decodeStill, drawImage, upscaleNow };
}

function createBitmap(width = MAX_CANVAS_WIDTH / 2, height = MAX_CANVAS_WIDTH / 4): FakeBitmap {
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
  test("decodes the image at the maximum width and draws it when upscaling is requested", async() => {
    const pendingDecode = deferred<ImageBitmap>();
    const bitmap = createBitmap();
    const { canvas, decodeStill, drawImage, upscaleNow } = setup(() => pendingDecode.promise);

    upscaleNow();
    expect(decodeStill).toHaveBeenCalledExactlyOnceWith(MEDIA, expect.any(AbortSignal), MAX_CANVAS_WIDTH);
    expect(canvas.hidden).toBe(true);

    pendingDecode.resolve(bitmap as unknown as ImageBitmap);
    await vi.waitFor(() => expect(drawImage).toHaveBeenCalledOnce());

    expect(drawImage).toHaveBeenCalledExactlyOnceWith(bitmap as unknown as ImageBitmap, 0, 0, bitmap.width, bitmap.height);
    expect([canvas.width, canvas.height, canvas.hidden]).toEqual([bitmap.width, bitmap.height, false]);
    expect(bitmap.close).toHaveBeenCalledOnce();
  });

  test("waits for the tile to stay in view before decoding", () => {
    const { upscaler, scheduler, decodeStill } = setup();

    upscaler.upscale();
    upscaler.upscale();
    scheduler.advance(QUIET_PERIOD - 1);
    expect(decodeStill).not.toHaveBeenCalled();
    scheduler.advance(1);
    expect(decodeStill).toHaveBeenCalledOnce();
  });

  test("never decodes a tile left before the delay passes", () => {
    const { upscaler, scheduler, decodeStill } = setup();

    upscaler.upscale();
    upscaler.cancel();
    scheduler.advance(QUIET_PERIOD);
    expect(decodeStill).not.toHaveBeenCalled();
  });

  test("scales a wide image down to the maximum width", async() => {
    expect(await drawnSize(createBitmap(MAX_CANVAS_WIDTH * 6, MAX_CANVAS_WIDTH * 4))).toEqual([MAX_CANVAS_WIDTH, Math.round(MAX_CANVAS_WIDTH * 4 / 6)]);
  });

  test("scales a tall image down to the maximum height", async() => {
    const width = Math.min(MAX_CANVAS_WIDTH, MAX_CANVAS_HEIGHT / 40);

    expect(await drawnSize(createBitmap(width * 2, MAX_CANVAS_HEIGHT * 2))).toEqual([width, MAX_CANVAS_HEIGHT]);
  });

  test("does not start another request while one is in flight", () => {
    const { decodeStill, upscaleNow } = setup(() => deferred<ImageBitmap>().promise);

    upscaleNow();
    upscaleNow();

    expect(decodeStill).toHaveBeenCalledOnce();
  });

  test("hides and shows a completed image without decoding it again", async() => {
    const { upscaler, canvas, decodeStill, drawImage, upscaleNow } = setup();

    upscaleNow();
    await vi.waitFor(() => expect(drawImage).toHaveBeenCalledOnce());
    upscaler.hide();
    expect(canvas.hidden).toBe(true);

    upscaler.upscale();

    expect(canvas.hidden).toBe(false);
    expect(decodeStill).toHaveBeenCalledOnce();
  });

  test("logs a failed request and tries again on the next request", async() => {
    const error = new Error("offline");
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { decodeStill, drawImage, upscaleNow } = setup(() => Promise.reject(error));

    onTestFinished(() => log.mockRestore());
    upscaleNow();
    await vi.waitFor(() => expect(log).toHaveBeenCalledWith(error));
    decodeStill.mockResolvedValue(createBitmap() as unknown as ImageBitmap);
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
    upscaler.cancel();
    fail(new Error("aborted"));
    await flushMicrotasks();
    expect(log).not.toHaveBeenCalled();
  });

  test("aborts an in-flight request when hidden", () => {
    const { upscaler, decodeStill, canvas, upscaleNow } = setup(() => deferred<ImageBitmap>().promise);

    upscaleNow();
    const signal = decodeStill.mock.calls[0][1];

    upscaler.hide();

    expect(signal.aborted).toBe(true);
    expect(canvas.hidden).toBe(true);
  });

  test("aborts a request and closes its bitmap if the result arrives later", async() => {
    const pendingDecode = deferred<ImageBitmap>();
    const bitmap = createBitmap();
    const { upscaler, canvas, decodeStill, drawImage, upscaleNow } = setup(() => pendingDecode.promise);

    upscaleNow();
    const signal = decodeStill.mock.calls[0][1];

    upscaler.cancel();

    expect(signal.aborted).toBe(true);
    pendingDecode.resolve(bitmap as unknown as ImageBitmap);
    await vi.waitFor(() => expect(bitmap.close).toHaveBeenCalledOnce());

    expect(drawImage).not.toHaveBeenCalled();
    expect(canvas.hidden).toBe(true);
  });
});
