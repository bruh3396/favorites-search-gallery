import { LightboxStage, LightboxStageClass, LightboxStageProps } from "@/core/ui/lightbox/stage/stage";
import { Mock, describe, expect, onTestFinished, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { BitmapDecoder } from "@/core/boundary/ports/bitmap_decoder/bitmap_decoder";
import LIGHTBOX_CSS from "@/core/ui/lightbox/lightbox.css?inline";
import { LightboxRendererClass } from "@/core/ui/lightbox/stage/renderer";
import { Media } from "@/core/domain/media/media";
import { MediaItem } from "@/core/domain/post/post";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css";

const FIRST: MediaItem = { id: "1", media: { kind: "image", locator: "images/1" } };
const SECOND: MediaItem = { id: "2", media: { kind: "image", locator: "images/2" } };
const FIRST_VIDEO: MediaItem = { id: "v1", media: { kind: "video", locator: "videos/1.mp4" } };
const SECOND_VIDEO: MediaItem = { id: "v2", media: { kind: "video", locator: "videos/2.mp4" } };
const ORIGINAL_ORIGIN = "https://original/";
const ORIGINAL_SIZE = { width: 1_200, height: 800 };

interface FakeBitmap {
  width: number;
  height: number;
  source: string;
  close: Mock<() => void>;
}

interface Setup {
  root: HTMLElement;
  preview: HTMLImageElement;
  original: HTMLCanvasElement;
  current: Signal<MediaItem | undefined>;
  neighbors: Signal<readonly MediaItem[]>;
  warmItems: Signal<readonly MediaItem[]>;
  scheduler: MemoryScheduler;
  fetchOriginal: Mock<LightboxStageProps["fetchOriginal"]>;
  resolveOriginalUrl: Mock<LightboxStageProps["resolveOriginalUrl"]>;
  resolveOriginalImageFallbackUrl: Mock<LightboxStageProps["resolveOriginalImageFallbackUrl"]>;
  decodeBitmap: Mock<BitmapDecoder["decode"]>;
  drawn: () => string[];
  bitmaps: FakeBitmap[];
}

interface FakeDrawing {
  drawImage: Mock<(bitmap: FakeBitmap) => void>;
  bitmaps: FakeBitmap[];
  bitmapDecoder: BitmapDecoder;
  decodeBitmap: Mock<BitmapDecoder["decode"]>;
}

type ResolvePreviewUrl = LightboxStageProps["resolvePreviewUrl"];

function fetchOriginalNow(media: Media): Promise<Blob> {
  return Promise.resolve(Object.assign(new Blob(), { source: `${ORIGINAL_ORIGIN}${media.locator}` }));
}

function pendForever<T>(): Promise<T> {
  return new Promise(() => undefined);
}

function fakeDrawing(): FakeDrawing {
  const drawImage = vi.fn<(bitmap: FakeBitmap) => void>();
  const bitmaps: FakeBitmap[] = [];
  const decodeBitmap = vi.fn<BitmapDecoder["decode"]>(source => {
    const blob = source as Blob & { source: string };
    const bitmap = { ...ORIGINAL_SIZE, source: blob.source, close: vi.fn() };

    bitmaps.push(bitmap);
    return Promise.resolve(bitmap as unknown as ImageBitmap);
  });
  const bitmapDecoder = {
    decode: decodeBitmap
  };
  const spy = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D);

  onTestFinished(() => spy.mockRestore());
  return { drawImage, bitmaps, bitmapDecoder, decodeBitmap };
}

function setup(
  fetch: LightboxStageProps["fetchOriginal"] = fetchOriginalNow,
  resolvePreviewUrl: ResolvePreviewUrl = media => Promise.resolve(`https://preview/${media.locator}`),
  resolveOriginal: LightboxStageProps["resolveOriginalUrl"] = media => Promise.resolve(`${ORIGINAL_ORIGIN}${media.locator}`)
): Setup {
  const { drawImage, bitmaps, bitmapDecoder, decodeBitmap } = fakeDrawing();
  const current = new Signal<MediaItem | undefined>(undefined);
  const neighbors = new Signal<readonly MediaItem[]>([]);
  const warmItems = new Signal<readonly MediaItem[]>([]);
  const scheduler = new MemoryScheduler();
  const fetchOriginal = vi.fn<LightboxStageProps["fetchOriginal"]>(fetch);
  const resolveOriginalUrl = vi.fn<LightboxStageProps["resolveOriginalUrl"]>(resolveOriginal);
  const resolveOriginalImageFallbackUrl = vi.fn<LightboxStageProps["resolveOriginalImageFallbackUrl"]>(media => Promise.resolve(`https://wimg.rule34.xxx/${media.locator}`));
  const { result } = render(document, () => (
    <LightboxStage
      current={current}
      neighbors={neighbors}
      warmItems={warmItems}
      resolvePreviewUrl={resolvePreviewUrl}
      resolveOriginalUrl={resolveOriginalUrl}
      resolveOriginalImageFallbackUrl={resolveOriginalImageFallbackUrl}
      fetchOriginal={fetchOriginal}
      bitmapDecoder={bitmapDecoder}
      scheduler={scheduler}
    />
  ));
  const preview = result.querySelector<HTMLImageElement>(`img.${LightboxRendererClass.media}`)!;
  const original = result.querySelector<HTMLCanvasElement>(`canvas.${LightboxRendererClass.media}`)!;
  return {
    root: result,
    preview,
    original,
    current,
    neighbors,
    warmItems,
    scheduler,
    fetchOriginal,
    resolveOriginalUrl,
    resolveOriginalImageFallbackUrl,
    decodeBitmap,
    bitmaps,
    drawn: () => drawImage.mock.calls.map(([bitmap]) => bitmap.source)
  };
}

function flushPromises(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve));
}

describe("LightboxStage", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(LightboxStageClass, LIGHTBOX_CSS);
    expectClassesStyled(LightboxRendererClass, LIGHTBOX_CSS);
  });

  test("shows the preview image while the original is pending without decoding the preview", async() => {
    const { preview, original, current, decodeBitmap } = setup(() => pendForever());

    current.value = FIRST;
    await vi.waitFor(() => expect(preview.getAttribute("src")).toBe("https://preview/images/1"));
    expect(preview.hidden).toBe(false);
    expect(original.hidden).toBe(true);
    expect(decodeBitmap).not.toHaveBeenCalled();
  });

  test("draws the original at its own size once it loads", async() => {
    const { preview, original, current, drawn } = setup();

    current.value = FIRST;
    await vi.waitFor(() => expect(drawn()).toContain(`${ORIGINAL_ORIGIN}images/1`));
    expect([original.width, original.height]).toEqual([ORIGINAL_SIZE.width, ORIGINAL_SIZE.height]);
    expect(preview.hidden).toBe(true);
    expect(original.hidden).toBe(false);
  });

  test("ignores a preview URL that resolves after switching posts", async() => {
    const finishResolving: Map<string, (url: string) => void> = new Map();
    const resolvePreviewUrl: ResolvePreviewUrl = media => new Promise(resolve => finishResolving.set(media.locator, resolve));
    const { current, preview } = setup(() => pendForever(), resolvePreviewUrl);

    current.value = FIRST;
    await vi.waitFor(() => expect(finishResolving.has(FIRST.media.locator)).toBe(true));
    current.value = SECOND;
    await vi.waitFor(() => expect(finishResolving.has(SECOND.media.locator)).toBe(true));
    finishResolving.get(SECOND.media.locator)!(`https://preview/${SECOND.media.locator}`);
    await vi.waitFor(() => expect(preview.getAttribute("src")).toBe(`https://preview/${SECOND.media.locator}`));
    finishResolving.get(FIRST.media.locator)!(`https://preview/${FIRST.media.locator}`);
    await flushPromises();
    expect(preview.getAttribute("src")).toBe(`https://preview/${SECOND.media.locator}`);
    expect(preview.hidden).toBe(false);
  });

  test("keeps the original visible when the preview URL resolves late", async() => {
    let finishResolving: ((url: string) => void) | undefined;
    const resolvePreviewUrl: ResolvePreviewUrl = () => new Promise(resolve => {
      finishResolving = resolve;
    });
    const { current, preview, original, drawn } = setup(fetchOriginalNow, resolvePreviewUrl);

    current.value = FIRST;
    await vi.waitFor(() => expect(drawn()).toContain(`${ORIGINAL_ORIGIN}images/1`));
    expect(preview.hidden).toBe(true);
    expect(original.hidden).toBe(false);
    finishResolving!(`https://preview/${FIRST.media.locator}`);
    await flushPromises();
    expect(preview.hidden).toBe(true);
    expect(original.hidden).toBe(false);
    expect(preview.getAttribute("src")).toBe(`https://preview/${FIRST.media.locator}`);
  });

  test("keeps the preview visible when the original fails", async() => {
    const { preview, original, current } = setup(() => Promise.reject(new Error("unreachable")));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    onTestFinished(() => consoleError.mockRestore());
    current.value = FIRST;
    await vi.waitFor(() => expect(preview.getAttribute("src")).toBe("https://preview/images/1"));
    await flushPromises();
    expect(preview.hidden).toBe(false);
    expect(original.hidden).toBe(true);
  });

  test("waits for quick steps to stop before fetching the original", async() => {
    const { current, scheduler, fetchOriginal } = setup(() => pendForever());

    current.value = FIRST;
    current.value = SECOND;
    await flushPromises();
    expect(fetchOriginal.mock.calls.map(([media]) => media)).toEqual([FIRST.media]);
    scheduler.advance(200);
    await flushPromises();
    expect(fetchOriginal.mock.calls.map(([media]) => media)).toEqual([FIRST.media, SECOND.media]);
  });

  test("keeps a late original from replacing the post shown since", async() => {
    const finishFetching: (() => void)[] = [];
    const fetchOriginal: LightboxStageProps["fetchOriginal"] = media => new Promise(resolve => {
      finishFetching.push(() => resolve(Object.assign(new Blob(), { source: `${ORIGINAL_ORIGIN}${media.locator}` })));
    });
    const { current, scheduler, drawn } = setup(fetchOriginal);

    current.value = FIRST;
    await flushPromises();
    current.value = SECOND;
    scheduler.advance(200);
    await flushPromises();
    finishFetching[0]();
    await flushPromises();
    expect(drawn()).not.toContain(`${ORIGINAL_ORIGIN}images/1`);
  });

  test("retries an original whose load failed", async() => {
    const fetchOriginal = vi.fn<LightboxStageProps["fetchOriginal"]>()
      .mockRejectedValueOnce(new Error("unreachable"))
      .mockImplementation(fetchOriginalNow);
    const { current, scheduler } = setup(fetchOriginal);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    onTestFinished(() => consoleError.mockRestore());
    current.value = FIRST;
    await flushPromises();
    current.value = undefined;
    scheduler.advance(200);
    current.value = FIRST;
    await flushPromises();
    expect(fetchOriginal).toHaveBeenCalledTimes(2);
  });

  test("loads the originals of the neighbors", async() => {
    const { neighbors, scheduler, fetchOriginal } = setup(() => pendForever());

    neighbors.value = [FIRST, SECOND];
    await flushPromises();
    expect(fetchOriginal).not.toHaveBeenCalled();
    scheduler.advance(200);
    await flushPromises();
    expect(fetchOriginal.mock.calls.map(([media]) => media)).toEqual([FIRST.media, SECOND.media]);
  });

  test("preloads the image neighbors within the stage limit", async() => {
    const { neighbors, scheduler, fetchOriginal } = setup(() => pendForever());
    const items = Array.from({ length: 24 }, (_, index): MediaItem => ({
      id: `${index}`,
      media: { kind: index % 2 === 0 ? "image" : "video", locator: `media/${index}` }
    }));

    neighbors.value = items;
    scheduler.advance(200);
    await flushPromises();
    const imageLocators = items.filter(item => item.media.kind === "image").slice(0, 20).map(item => item.media.locator);

    expect(fetchOriginal.mock.calls.map(([media]) => media.locator)).toEqual(imageLocators);
  });

  test("reuses a neighbor's original once it is shown", async() => {
    const { current, neighbors, scheduler, fetchOriginal, drawn } = setup();

    neighbors.value = [SECOND];
    scheduler.advance(200);
    await flushPromises();
    current.value = SECOND;
    await vi.waitFor(() => expect(drawn()).toContain(`${ORIGINAL_ORIGIN}images/2`));
    expect(fetchOriginal).toHaveBeenCalledOnce();
  });

  test("loads the originals of warm items before the neighbors", async() => {
    const { neighbors, warmItems, scheduler, fetchOriginal } = setup(() => pendForever());

    neighbors.value = [FIRST];
    warmItems.value = [SECOND];
    scheduler.advance(75);
    await flushPromises();
    expect(fetchOriginal.mock.calls.map(([media]) => media)).toEqual([SECOND.media, FIRST.media]);
  });

  test("reuses a warm item's original once it is shown and the warm items clear", async() => {
    const { current, warmItems, scheduler, fetchOriginal, drawn } = setup();

    warmItems.value = [FIRST];
    scheduler.advance(75);
    await flushPromises();
    current.value = FIRST;
    warmItems.value = [];
    await vi.waitFor(() => expect(drawn()).toContain(`${ORIGINAL_ORIGIN}images/1`));
    expect(fetchOriginal).toHaveBeenCalledOnce();
  });

  test("cancels the download of a warm item replaced while closed", async() => {
    const { warmItems, scheduler, fetchOriginal } = setup(() => pendForever());

    warmItems.value = [FIRST];
    scheduler.advance(75);
    await flushPromises();
    warmItems.value = [SECOND];

    expect(fetchOriginal.mock.calls[0][1].aborted).toBe(true);
  });

  test("cancels the download of a post no longer shown or next to it", async() => {
    const { current, neighbors, scheduler, fetchOriginal } = setup(() => pendForever());

    current.value = FIRST;
    neighbors.value = [SECOND];
    scheduler.advance(200);
    await flushPromises();
    neighbors.value = [];
    const signalByLocator = new Map(fetchOriginal.mock.calls.map(([media, signal]) => [media.locator, signal]));

    expect(signalByLocator.get(FIRST.media.locator)?.aborted).toBe(false);
    expect(signalByLocator.get(SECOND.media.locator)?.aborted).toBe(true);
  });

  test("replaces a pending neighbor preload when the neighbors change", async() => {
    const { neighbors, scheduler, fetchOriginal } = setup(() => pendForever());

    neighbors.value = [FIRST];
    scheduler.advance(30);
    neighbors.value = [SECOND];
    scheduler.advance(74);
    await flushPromises();
    expect(fetchOriginal).not.toHaveBeenCalled();
    scheduler.advance(1);
    await flushPromises();
    expect(fetchOriginal.mock.calls.map(([media]) => media)).toEqual([SECOND.media]);
  });

  test("shows the current video immediately and delays candidate preloading", async() => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    const pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
    const load = vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => undefined);
    const { root, current, neighbors, scheduler, resolveOriginalUrl } = setup();

    onTestFinished(() => {
      play.mockRestore();
      pause.mockRestore();
      load.mockRestore();
    });
    current.value = FIRST_VIDEO;
    neighbors.value = [SECOND_VIDEO];
    const videos = [...root.querySelectorAll("video")];

    expect(videos).toHaveLength(5);
    expect(videos.filter(video => !video.hidden)).toHaveLength(1);
    expect(resolveOriginalUrl.mock.calls.map(([media]) => media)).toEqual([FIRST_VIDEO.media]);
    scheduler.advance(74);
    expect(resolveOriginalUrl).toHaveBeenCalledOnce();
    scheduler.advance(1);
    expect(resolveOriginalUrl.mock.calls.map(([media]) => media)).toEqual([FIRST_VIDEO.media, SECOND_VIDEO.media]);
    await vi.waitFor(() => expect(play).toHaveBeenCalledOnce());
    expect(videos.filter(video => !video.hidden)).toHaveLength(1);

    current.value = undefined;
    expect(videos.every(video => video.hidden)).toBe(true);
    expect(videos[0].parentElement?.hidden).toBe(true);
  });

  test("clears the canvas and frees the originals once no post is shown", async() => {
    const { preview, original, current, neighbors, bitmaps, drawn } = setup();

    current.value = FIRST;
    await vi.waitFor(() => expect(drawn()).toContain(`${ORIGINAL_ORIGIN}images/1`));
    current.value = undefined;
    neighbors.value = [];
    await flushPromises();
    expect([original.width, original.height]).toEqual([0, 0]);
    expect(original.hidden).toBe(true);
    expect(preview.hidden).toBe(true);
    expect(preview.hasAttribute("src")).toBe(false);
    expect(bitmaps.every(bitmap => bitmap.close.mock.calls.length === 1)).toBe(true);
  });
});
