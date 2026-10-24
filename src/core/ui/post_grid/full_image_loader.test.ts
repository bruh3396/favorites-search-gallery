import { DECODE_DEBOUNCE, PAINT_RATE_LIMIT } from "@/core/ui/post_grid/image_loader_service";
import { FullImageLoader, MAX_CANVAS_HEIGHT, MAX_CANVAS_WIDTH } from "@/core/ui/post_grid/full_image_loader";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { BatchDebouncer } from "@/core/utils/async/batch_debouncer";
import { Media } from "@/core/domain/media/media";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { RateLimiter } from "@/core/utils/async/rate_limiter";
import { Signal } from "@/core/utils/reactive/signal";
import { doNothing } from "@/core/utils/function/function";
import { flushMicrotasks } from "@/testing/async";

const MEDIA: Media = { kind: "image", locator: "images/123" };
const QUIET_PERIOD = DECODE_DEBOUNCE.delay;

interface FakeBitmap {
  width: number;
  height: number;
  close: () => void;
}

type DecodeStill = (media: Media, signal: AbortSignal, width: number) => Promise<ImageBitmap>;

interface Setup {
  fullImageLoader: FullImageLoader;
  scheduler: MemoryScheduler;
  canvas: HTMLCanvasElement;
  decodeStill: ReturnType<typeof vi.fn<DecodeStill>>;
  drawImage: ReturnType<typeof vi.fn>;
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
  const enabled = new Signal(true);
  const paused = new Signal(false);
  const fullImageLoader = new FullImageLoader({
    canvas, media: MEDIA, decodeStill, enabled, paused,
    decodeDebouncer: new BatchDebouncer(DECODE_DEBOUNCE, scheduler), paintLimiter: new RateLimiter(PAINT_RATE_LIMIT, scheduler)
  });
  const showNow = (): void => {
    fullImageLoader.show();
    scheduler.advance(QUIET_PERIOD);
  };

  onTestFinished(() => getContext.mockRestore());
  return { fullImageLoader, scheduler, canvas, decodeStill, drawImage, enabled, paused, showNow };
}

function createBitmap(width = MAX_CANVAS_WIDTH / 2, height = MAX_CANVAS_WIDTH / 4): FakeBitmap {
  return { width, height, close: vi.fn() };
}

async function drawnSize(bitmap: FakeBitmap): Promise<number[]> {
  const { canvas, drawImage, showNow } = setup(() => Promise.resolve(bitmap as unknown as ImageBitmap));

  showNow();
  await vi.waitFor(() => expect(drawImage).toHaveBeenCalledOnce());
  expect(drawImage).toHaveBeenCalledWith(bitmap, 0, 0, canvas.width, canvas.height);
  return [canvas.width, canvas.height];
}

describe("FullImageLoader", () => {
  test("decodes the image at the maximum width and draws it when shown", async() => {
    const pendingDecode = deferred<ImageBitmap>();
    const bitmap = createBitmap();
    const { canvas, decodeStill, drawImage, showNow } = setup(() => pendingDecode.promise);

    showNow();
    expect(decodeStill).toHaveBeenCalledExactlyOnceWith(MEDIA, expect.any(AbortSignal), MAX_CANVAS_WIDTH);
    expect(canvas.hidden).toBe(true);

    pendingDecode.resolve(bitmap as unknown as ImageBitmap);
    await vi.waitFor(() => expect(drawImage).toHaveBeenCalledOnce());

    expect(drawImage).toHaveBeenCalledExactlyOnceWith(bitmap as unknown as ImageBitmap, 0, 0, bitmap.width, bitmap.height);
    expect([canvas.width, canvas.height, canvas.hidden]).toEqual([bitmap.width, bitmap.height, false]);
    expect(bitmap.close).toHaveBeenCalledOnce();
  });

  test("waits for the tile to stay in view before decoding", () => {
    const { fullImageLoader, scheduler, decodeStill } = setup();

    fullImageLoader.show();
    fullImageLoader.show();
    scheduler.advance(QUIET_PERIOD - 1);
    expect(decodeStill).not.toHaveBeenCalled();
    scheduler.advance(1);
    expect(decodeStill).toHaveBeenCalledOnce();
  });

  test("never decodes a tile left before the delay passes", () => {
    const { fullImageLoader, scheduler, decodeStill } = setup();

    fullImageLoader.show();
    fullImageLoader.cancel();
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
    const { decodeStill, showNow } = setup(() => deferred<ImageBitmap>().promise);

    showNow();
    showNow();

    expect(decodeStill).toHaveBeenCalledOnce();
  });

  test("hides and shows a completed image without decoding it again", async() => {
    const { fullImageLoader, canvas, decodeStill, drawImage, showNow } = setup();

    showNow();
    await vi.waitFor(() => expect(drawImage).toHaveBeenCalledOnce());
    fullImageLoader.hide();
    expect(canvas.hidden).toBe(true);

    fullImageLoader.show();

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
    const { fullImageLoader, showNow } = setup(() => new Promise((_, reject) => {
      fail = reject;
    }));

    onTestFinished(() => log.mockRestore());
    showNow();
    fullImageLoader.cancel();
    fail(new Error("aborted"));
    await flushMicrotasks();
    expect(log).not.toHaveBeenCalled();
  });

  test("aborts an in-flight request when hidden", () => {
    const { fullImageLoader, decodeStill, canvas, showNow } = setup(() => deferred<ImageBitmap>().promise);

    showNow();
    const signal = decodeStill.mock.calls[0][1];

    fullImageLoader.hide();

    expect(signal.aborted).toBe(true);
    expect(canvas.hidden).toBe(true);
  });

  test("aborts a request and closes its bitmap if the result arrives later", async() => {
    const pendingDecode = deferred<ImageBitmap>();
    const bitmap = createBitmap();
    const { fullImageLoader, canvas, decodeStill, drawImage, showNow } = setup(() => pendingDecode.promise);

    showNow();
    const signal = decodeStill.mock.calls[0][1];

    fullImageLoader.cancel();

    expect(signal.aborted).toBe(true);
    pendingDecode.resolve(bitmap as unknown as ImageBitmap);
    await vi.waitFor(() => expect(bitmap.close).toHaveBeenCalledOnce());

    expect(drawImage).not.toHaveBeenCalled();
    expect(canvas.hidden).toBe(true);
  });

  test("closes a decoded bitmap without drawing it when cancelled while waiting to paint", async() => {
    const { scheduler, drawImage } = setup();
    const decodeDebouncer = new BatchDebouncer(DECODE_DEBOUNCE, scheduler);
    const paintLimiter = new RateLimiter(PAINT_RATE_LIMIT, scheduler);
    const bitmaps = [createBitmap(), createBitmap()];
    const [first, second] = bitmaps.map(bitmap => new FullImageLoader({
      canvas: document.createElement("canvas"), media: MEDIA, paintLimiter, decodeDebouncer, enabled: new Signal(true), paused: new Signal(false),
      decodeStill: () => Promise.resolve(bitmap as unknown as ImageBitmap)
    }));

    first.show();
    second.show();
    scheduler.advance(QUIET_PERIOD);
    await vi.waitFor(() => expect(drawImage).toHaveBeenCalledOnce());
    second.cancel();
    scheduler.advance(1_000);
    await vi.waitFor(() => expect(bitmaps[1].close).toHaveBeenCalledOnce());
    expect(drawImage).toHaveBeenCalledOnce();
  });

  describe("trackVisibility", () => {
    function spyOnActions(fullImageLoader: FullImageLoader): Record<"show" | "hide" | "cancel", ReturnType<typeof vi.fn>> {
      return {
        show: vi.spyOn(fullImageLoader, "show").mockImplementation(doNothing),
        hide: vi.spyOn(fullImageLoader, "hide").mockImplementation(doNothing),
        cancel: vi.spyOn(fullImageLoader, "cancel").mockImplementation(doNothing)
      };
    }

    test("shows while enabled and visible, and hides once disabled", () => {
      const { fullImageLoader, enabled } = setup();
      const { show, hide, cancel } = spyOnActions(fullImageLoader);
      const visible = new Signal(false);

      fullImageLoader.trackVisibility(visible);
      expect(cancel).toHaveBeenCalledOnce();
      visible.value = true;
      expect(show).toHaveBeenCalledOnce();
      enabled.value = false;
      expect(hide).toHaveBeenCalledOnce();
    });

    test("cancels loading while paused without hiding a shown image, and resumes after", () => {
      const { fullImageLoader, paused } = setup();
      const { show, hide, cancel } = spyOnActions(fullImageLoader);

      fullImageLoader.trackVisibility(new Signal(true));
      show.mockClear();
      paused.value = true;
      expect([cancel.mock.calls.length, hide.mock.calls.length, show.mock.calls.length]).toEqual([1, 0, 0]);
      paused.value = false;
      expect(show).toHaveBeenCalledOnce();
    });

    test("cancels and stops following once stopped", () => {
      const { fullImageLoader } = setup();
      const { show, cancel } = spyOnActions(fullImageLoader);
      const visible = new Signal(false);
      const stop = fullImageLoader.trackVisibility(visible);

      cancel.mockClear();
      stop();
      visible.value = true;
      expect([cancel.mock.calls.length, show.mock.calls.length]).toEqual([1, 0]);
    });
  });
});
