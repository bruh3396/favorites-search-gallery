import { ImageLoader } from "@/core/ui/post_grid/image_loader";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { BatchDebouncer } from "@/core/utils/async/batch_debouncer";
import { Media } from "@/core/domain/media/media";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { RateLimiter } from "@/core/utils/async/rate_limiter";
import { Signal } from "@/core/utils/reactive/signal";
import { doNothing } from "@/core/utils/function/function_utilities";
import { flushMicrotasks } from "@/testing/microtask_utilities";

const MEDIA: Media = { kind: "image", locator: "images/123" };
const DECODE_DEBOUNCE = { delay: 100 };
const PAINT_RATE_LIMIT = { concurrency: 1, ratePerSecond: 1_000 };
const MAX_CANVAS_HEIGHT = 1_000;
const QUIET_PERIOD = DECODE_DEBOUNCE.delay;
const WIDTH = 500;

interface FakeBitmap {
  width: number;
  height: number;
  close: () => void;
}

type DecodeStill = (media: Media, signal: AbortSignal, width: number) => Promise<ImageBitmap>;

interface Setup {
  imageLoader: ImageLoader;
  scheduler: MemoryScheduler;
  canvas: HTMLCanvasElement;
  decodeStill: ReturnType<typeof vi.fn<DecodeStill>>;
  drawImage: ReturnType<typeof vi.fn>;
  targetWidth: Signal<number>;
  enabled: Signal<boolean>;
  paused: Signal<boolean>;
  showNow: () => void;
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
  const targetWidth = new Signal(WIDTH);
  const enabled = new Signal(true);
  const paused = new Signal(false);
  const imageLoader = new ImageLoader({ maxCanvasHeight: MAX_CANVAS_HEIGHT }, {
    canvas, media: MEDIA, targetWidth, decodeStill, enabled, paused,
    batchDebouncer: new BatchDebouncer(DECODE_DEBOUNCE, scheduler), paintRateLimiter: new RateLimiter(PAINT_RATE_LIMIT, scheduler)
  });
  const showNow = (): void => {
    imageLoader.show();
    scheduler.advance(QUIET_PERIOD);
  };

  onTestFinished(() => getContext.mockRestore());
  return { imageLoader, scheduler, canvas, decodeStill, drawImage, targetWidth, enabled, paused, showNow };
}

function createBitmap(width = WIDTH / 2, height = WIDTH / 4): FakeBitmap {
  return { width, height, close: vi.fn() };
}

async function drawnSize(fakeBitmap: FakeBitmap): Promise<number[]> {
  const { canvas, drawImage, showNow } = setup(() => Promise.resolve(fakeBitmap as unknown as ImageBitmap));

  showNow();
  await vi.waitFor(() => expect(drawImage).toHaveBeenCalledOnce());
  expect(drawImage).toHaveBeenCalledWith(fakeBitmap, 0, 0, canvas.width, canvas.height);
  return [canvas.width, canvas.height];
}

describe("ImageLoader", () => {
  test("decodes the image at the target width and draws it when shown", async() => {
    const pendingDecode = deferred<ImageBitmap>();
    const fakeBitmap = createBitmap();
    const { canvas, decodeStill, drawImage, showNow } = setup(() => pendingDecode.promise);

    showNow();
    expect(decodeStill).toHaveBeenCalledExactlyOnceWith(MEDIA, expect.any(AbortSignal), WIDTH);
    expect(canvas.hidden).toBe(true);

    pendingDecode.resolve(fakeBitmap as unknown as ImageBitmap);
    await vi.waitFor(() => expect(drawImage).toHaveBeenCalledOnce());

    expect(drawImage).toHaveBeenCalledExactlyOnceWith(fakeBitmap as unknown as ImageBitmap, 0, 0, fakeBitmap.width, fakeBitmap.height);
    expect([canvas.width, canvas.height, canvas.hidden]).toEqual([fakeBitmap.width, fakeBitmap.height, false]);
    expect(fakeBitmap.close).toHaveBeenCalledOnce();
  });

  test("waits for the tile to stay in view before decoding", () => {
    const { imageLoader, scheduler, decodeStill } = setup();

    imageLoader.show();
    imageLoader.show();
    scheduler.advance(QUIET_PERIOD - 1);
    expect(decodeStill).not.toHaveBeenCalled();
    scheduler.advance(1);
    expect(decodeStill).toHaveBeenCalledOnce();
  });

  test("never decodes a tile left before the delay passes", () => {
    const { imageLoader, scheduler, decodeStill } = setup();

    imageLoader.show();
    imageLoader.cancel();
    scheduler.advance(QUIET_PERIOD);
    expect(decodeStill).not.toHaveBeenCalled();
  });

  test("scales a wide image down to the target width", async() => {
    expect(await drawnSize(createBitmap(WIDTH * 6, WIDTH * 4))).toEqual([WIDTH, Math.round(WIDTH * 4 / 6)]);
  });

  test("scales a tall image down to the maximum height", async() => {
    const width = Math.min(WIDTH, MAX_CANVAS_HEIGHT / 40);

    expect(await drawnSize(createBitmap(width * 2, MAX_CANVAS_HEIGHT * 2))).toEqual([width, MAX_CANVAS_HEIGHT]);
  });

  test("does not start another request while one is in flight", () => {
    const { decodeStill, showNow } = setup(() => deferred<ImageBitmap>().promise);

    showNow();
    showNow();

    expect(decodeStill).toHaveBeenCalledOnce();
  });

  test("decodes nothing while the target width is zero", () => {
    const { decodeStill, targetWidth, showNow } = setup();

    targetWidth.value = 0;
    showNow();
    expect(decodeStill).not.toHaveBeenCalled();
  });

  test("decodes again at a target width wider than the drawn one, keeping the drawn image shown", async() => {
    const { canvas, decodeStill, drawImage, targetWidth, showNow } = setup();

    showNow();
    await vi.waitFor(() => expect(drawImage).toHaveBeenCalledOnce());
    targetWidth.value = WIDTH * 2;
    showNow();

    expect(canvas.hidden).toBe(false);
    expect(decodeStill).toHaveBeenLastCalledWith(MEDIA, expect.any(AbortSignal), WIDTH * 2);
    await vi.waitFor(() => expect(drawImage).toHaveBeenCalledTimes(2));
  });

  test("keeps the drawn image when the target width shrinks", async() => {
    const { decodeStill, drawImage, targetWidth, showNow } = setup();

    showNow();
    await vi.waitFor(() => expect(drawImage).toHaveBeenCalledOnce());
    targetWidth.value = WIDTH / 2;
    showNow();
    expect(decodeStill).toHaveBeenCalledOnce();
  });

  test("replaces an in-flight request with one at a wider target width", () => {
    const { decodeStill, targetWidth, showNow } = setup(() => deferred<ImageBitmap>().promise);

    showNow();
    const narrowSignal = decodeStill.mock.calls[0][1];

    targetWidth.value = WIDTH * 2;
    showNow();
    expect(narrowSignal.aborted).toBe(true);
    expect(decodeStill).toHaveBeenLastCalledWith(MEDIA, expect.any(AbortSignal), WIDTH * 2);
  });

  test("decodes at the target width when the held decode starts, not when it was held", () => {
    const { imageLoader, scheduler, decodeStill, targetWidth } = setup();

    imageLoader.show();
    targetWidth.value = WIDTH * 2;
    scheduler.advance(QUIET_PERIOD);
    expect(decodeStill).toHaveBeenCalledExactlyOnceWith(MEDIA, expect.any(AbortSignal), WIDTH * 2);
  });

  test("hides and shows a completed image without decoding it again", async() => {
    const { imageLoader, canvas, decodeStill, drawImage, showNow } = setup();

    showNow();
    await vi.waitFor(() => expect(drawImage).toHaveBeenCalledOnce());
    imageLoader.hide();
    expect(canvas.hidden).toBe(true);

    imageLoader.show();

    expect(canvas.hidden).toBe(false);
    expect(decodeStill).toHaveBeenCalledOnce();
  });

  test("logs a failed request and tries again on the next request", async() => {
    const error = new Error("offline");
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { decodeStill, drawImage, showNow } = setup(() => Promise.reject(error));

    onTestFinished(() => log.mockRestore());
    showNow();
    await vi.waitFor(() => expect(log).toHaveBeenCalledWith(error));
    decodeStill.mockResolvedValue(createBitmap() as unknown as ImageBitmap);
    showNow();
    await vi.waitFor(() => expect(drawImage).toHaveBeenCalledOnce());
  });

  test("ignores the failure of a request it already aborted", async() => {
    let fail: (error: Error) => void = () => undefined;
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { imageLoader, showNow } = setup(() => new Promise((_, reject) => {
      fail = reject;
    }));

    onTestFinished(() => log.mockRestore());
    showNow();
    imageLoader.cancel();
    fail(new Error("aborted"));
    await flushMicrotasks();
    expect(log).not.toHaveBeenCalled();
  });

  test("aborts an in-flight request when hidden", () => {
    const { imageLoader, decodeStill, canvas, showNow } = setup(() => deferred<ImageBitmap>().promise);

    showNow();
    const signal = decodeStill.mock.calls[0][1];

    imageLoader.hide();

    expect(signal.aborted).toBe(true);
    expect(canvas.hidden).toBe(true);
  });

  test("aborts a request and closes its bitmap if the result arrives later", async() => {
    const pendingDecode = deferred<ImageBitmap>();
    const fakeBitmap = createBitmap();
    const { imageLoader, canvas, decodeStill, drawImage, showNow } = setup(() => pendingDecode.promise);

    showNow();
    const signal = decodeStill.mock.calls[0][1];

    imageLoader.cancel();

    expect(signal.aborted).toBe(true);
    pendingDecode.resolve(fakeBitmap as unknown as ImageBitmap);
    await vi.waitFor(() => expect(fakeBitmap.close).toHaveBeenCalledOnce());

    expect(drawImage).not.toHaveBeenCalled();
    expect(canvas.hidden).toBe(true);
  });

  test("closes a decoded bitmap without drawing it when cancelled while waiting to paint", async() => {
    const { scheduler, drawImage } = setup();
    const batchDebouncer = new BatchDebouncer(DECODE_DEBOUNCE, scheduler);
    const rateLimiter = new RateLimiter(PAINT_RATE_LIMIT, scheduler);
    const fakeBitmaps = [createBitmap(), createBitmap()];
    const [firstImageLoader, secondImageLoader] = fakeBitmaps.map(fakeBitmap => new ImageLoader({ maxCanvasHeight: MAX_CANVAS_HEIGHT }, {
      canvas: document.createElement("canvas"), media: MEDIA, targetWidth: new Signal(WIDTH), paintRateLimiter: rateLimiter, batchDebouncer,
      enabled: new Signal(true), paused: new Signal(false),
      decodeStill: (): Promise<ImageBitmap> => Promise.resolve(fakeBitmap as unknown as ImageBitmap)
    }));

    firstImageLoader.show();
    secondImageLoader.show();
    scheduler.advance(QUIET_PERIOD);
    await vi.waitFor(() => expect(drawImage).toHaveBeenCalledOnce());
    secondImageLoader.cancel();
    scheduler.advance(1_000);
    await vi.waitFor(() => expect(fakeBitmaps[1].close).toHaveBeenCalledOnce());
    expect(drawImage).toHaveBeenCalledOnce();
  });

  describe("trackVisibility", () => {
    function spyOnActions(imageLoader: ImageLoader): Record<"show" | "hide" | "cancel", ReturnType<typeof vi.fn>> {
      return {
        show: vi.spyOn(imageLoader, "show").mockImplementation(doNothing),
        hide: vi.spyOn(imageLoader, "hide").mockImplementation(doNothing),
        cancel: vi.spyOn(imageLoader, "cancel").mockImplementation(doNothing)
      };
    }

    test("shows while enabled and visible, and hides once disabled", () => {
      const { imageLoader, enabled } = setup();
      const { show, hide, cancel } = spyOnActions(imageLoader);
      const visible = new Signal(false);

      imageLoader.trackVisibility(visible);
      expect(cancel).toHaveBeenCalledOnce();
      visible.value = true;
      expect(show).toHaveBeenCalledOnce();
      enabled.value = false;
      expect(hide).toHaveBeenCalledOnce();
    });

    test("cancels loading while paused without hiding a shown image, and resumes after", () => {
      const { imageLoader, paused } = setup();
      const { show, hide, cancel } = spyOnActions(imageLoader);

      imageLoader.trackVisibility(new Signal(true));
      show.mockClear();
      paused.value = true;
      expect([cancel.mock.calls.length, hide.mock.calls.length, show.mock.calls.length]).toEqual([1, 0, 0]);
      paused.value = false;
      expect(show).toHaveBeenCalledOnce();
    });

    test("decodes again when the target width grows while visible", async() => {
      const { imageLoader, scheduler, decodeStill, drawImage, targetWidth } = setup();

      imageLoader.trackVisibility(new Signal(true));
      scheduler.advance(QUIET_PERIOD);
      await vi.waitFor(() => expect(drawImage).toHaveBeenCalledOnce());
      targetWidth.value = WIDTH * 2;
      scheduler.advance(QUIET_PERIOD);
      expect(decodeStill).toHaveBeenLastCalledWith(MEDIA, expect.any(AbortSignal), WIDTH * 2);
    });

    test("cancels and stops following once stopped", () => {
      const { imageLoader } = setup();
      const { show, cancel } = spyOnActions(imageLoader);
      const visible = new Signal(false);
      const stop = imageLoader.trackVisibility(visible);

      cancel.mockClear();
      stop();
      visible.value = true;
      expect([cancel.mock.calls.length, show.mock.calls.length]).toEqual([1, 0]);
    });
  });
});
