import { LightboxStage, LightboxStageClass, LightboxStageController, LightboxStageProps } from "@/core/ui/lightbox/stage/stage";
import { Mock, describe, expect, onTestFinished, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import LIGHTBOX_CSS from "@/core/ui/lightbox/lightbox.css?inline";
import { LightboxRendererClass } from "@/core/ui/lightbox/stage/renderer";
import { Media } from "@/core/domain/media/media";
import { MediaItem } from "@/core/domain/post/post";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { MorphSource } from "@/core/boundary/ports/morpher/morpher";
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
  decodeOriginal: Mock<LightboxStageProps["decodeOriginal"]>;
  resolveOriginalUrl: Mock<LightboxStageProps["resolveOriginalUrl"]>;
  drawn: () => string[];
  bitmaps: FakeBitmap[];
  readShownMedia: () => MorphSource | undefined;
}

type ResolvePreviewUrl = LightboxStageProps["resolvePreviewUrl"];
type DecodeOriginal = LightboxStageProps["decodeOriginal"];

function decodeOriginalNow(media: Media): Promise<ImageBitmap> {
  const bitmap = { ...ORIGINAL_SIZE, source: `${ORIGINAL_ORIGIN}${media.locator}`, close: vi.fn() };
  return Promise.resolve(bitmap as unknown as ImageBitmap);
}

function pendForever<T>(): Promise<T> {
  return new Promise(() => undefined);
}

function stubDrawing(): Mock<(bitmap: FakeBitmap) => void> {
  const drawImage = vi.fn<(bitmap: FakeBitmap) => void>();
  const spy = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D);

  onTestFinished(() => spy.mockRestore());
  return drawImage;
}

function setup(
  decode: DecodeOriginal = decodeOriginalNow,
  resolvePreviewUrl: ResolvePreviewUrl = media => Promise.resolve(`https://preview/${media.locator}`),
  resolveOriginal: LightboxStageProps["resolveOriginalUrl"] = media => Promise.resolve(`${ORIGINAL_ORIGIN}${media.locator}`)
): Setup {
  const drawImage = stubDrawing();
  const bitmaps: FakeBitmap[] = [];
  const current = new Signal<MediaItem | undefined>(undefined);
  const neighbors = new Signal<readonly MediaItem[]>([]);
  const warmItems = new Signal<readonly MediaItem[]>([]);
  const scheduler = new MemoryScheduler();
  const decodeOriginal = vi.fn<DecodeOriginal>((media, signal) => decode(media, signal).then(bitmap => {
    bitmaps.push(bitmap as unknown as FakeBitmap);
    return bitmap;
  }));
  const resolveOriginalUrl = vi.fn<LightboxStageProps["resolveOriginalUrl"]>(resolveOriginal);
  let readShownMedia = (): MorphSource | undefined => undefined;
  const { result } = render(document, () => (
    <LightboxStage
      current={current}
      neighbors={neighbors}
      warmItems={warmItems}
      resolvePreviewUrl={resolvePreviewUrl}
      resolveOriginalUrl={resolveOriginalUrl}
      decodeOriginal={decodeOriginal}
      scheduler={scheduler}
      exposeShownMedia={read => {
        readShownMedia = read;
      }}
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
    decodeOriginal,
    resolveOriginalUrl,
    bitmaps,
    drawn: () => drawImage.mock.calls.map(([bitmap]) => bitmap.source),
    readShownMedia: () => readShownMedia()
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

  test("shows the preview image while the original is pending", async() => {
    const { preview, original, current } = setup(() => pendForever());

    current.value = FIRST;
    await vi.waitFor(() => expect(preview.getAttribute("src")).toBe("https://preview/images/1"));
    expect(preview.hidden).toBe(false);
    expect(original.hidden).toBe(true);
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
    const { current, preview, original, drawn } = setup(decodeOriginalNow, resolvePreviewUrl);

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
    const { current, scheduler, decodeOriginal } = setup(() => pendForever());

    current.value = FIRST;
    current.value = SECOND;
    await flushPromises();
    expect(decodeOriginal.mock.calls.map(([media]) => media)).toEqual([FIRST.media]);
    scheduler.advance(200);
    await flushPromises();
    expect(decodeOriginal.mock.calls.map(([media]) => media)).toEqual([FIRST.media, SECOND.media]);
  });

  test("keeps a late original from replacing the post shown since", async() => {
    const finishFetching: (() => void)[] = [];
    const decodeOriginal: DecodeOriginal = media => new Promise(resolve => {
      finishFetching.push(() => resolve(decodeOriginalNow(media)));
    });
    const { current, scheduler, drawn } = setup(decodeOriginal);

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
    const decode = vi.fn<DecodeOriginal>()
      .mockRejectedValueOnce(new Error("unreachable"))
      .mockImplementation(decodeOriginalNow);
    const { current, scheduler, decodeOriginal } = setup(decode);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    onTestFinished(() => consoleError.mockRestore());
    current.value = FIRST;
    await flushPromises();
    current.value = undefined;
    scheduler.advance(200);
    current.value = FIRST;
    await flushPromises();
    expect(decodeOriginal).toHaveBeenCalledTimes(2);
  });

  test("loads the originals of the neighbors", async() => {
    const { neighbors, scheduler, decodeOriginal } = setup(() => pendForever());

    neighbors.value = [FIRST, SECOND];
    await flushPromises();
    expect(decodeOriginal).not.toHaveBeenCalled();
    scheduler.advance(200);
    await flushPromises();
    expect(decodeOriginal.mock.calls.map(([media]) => media)).toEqual([FIRST.media, SECOND.media]);
  });

  test("reuses a neighbor's original once it is shown", async() => {
    const { current, neighbors, scheduler, decodeOriginal, drawn } = setup();

    neighbors.value = [SECOND];
    scheduler.advance(200);
    await flushPromises();
    current.value = SECOND;
    await vi.waitFor(() => expect(drawn()).toContain(`${ORIGINAL_ORIGIN}images/2`));
    expect(decodeOriginal).toHaveBeenCalledOnce();
  });

  test("loads the originals of warm items before the neighbors", async() => {
    const { neighbors, warmItems, scheduler, decodeOriginal } = setup(() => pendForever());

    neighbors.value = [FIRST];
    warmItems.value = [SECOND];
    scheduler.advance(75);
    await flushPromises();
    expect(decodeOriginal.mock.calls.map(([media]) => media)).toEqual([SECOND.media, FIRST.media]);
  });

  test("reuses a warm item's original once it is shown and the warm items clear", async() => {
    const { current, warmItems, scheduler, decodeOriginal, drawn } = setup();

    warmItems.value = [FIRST];
    scheduler.advance(75);
    await flushPromises();
    current.value = FIRST;
    warmItems.value = [];
    await vi.waitFor(() => expect(drawn()).toContain(`${ORIGINAL_ORIGIN}images/1`));
    expect(decodeOriginal).toHaveBeenCalledOnce();
  });

  test("cancels the download of a warm item replaced while closed", async() => {
    const { warmItems, scheduler, decodeOriginal } = setup(() => pendForever());

    warmItems.value = [FIRST];
    scheduler.advance(75);
    await flushPromises();
    warmItems.value = [SECOND];

    expect(decodeOriginal.mock.calls[0][1].aborted).toBe(true);
  });

  test("cancels the download of a post no longer shown or next to it", async() => {
    const { current, neighbors, scheduler, decodeOriginal } = setup(() => pendForever());

    current.value = FIRST;
    neighbors.value = [SECOND];
    scheduler.advance(200);
    await flushPromises();
    neighbors.value = [];
    const signalByLocator = new Map(decodeOriginal.mock.calls.map(([media, signal]) => [media.locator, signal]));

    expect(signalByLocator.get(FIRST.media.locator)?.aborted).toBe(false);
    expect(signalByLocator.get(SECOND.media.locator)?.aborted).toBe(true);
  });

  test("replaces a pending neighbor preload when the neighbors change", async() => {
    const { neighbors, scheduler, decodeOriginal } = setup(() => pendForever());

    neighbors.value = [FIRST];
    scheduler.advance(30);
    neighbors.value = [SECOND];
    scheduler.advance(74);
    await flushPromises();
    expect(decodeOriginal).not.toHaveBeenCalled();
    scheduler.advance(1);
    await flushPromises();
    expect(decodeOriginal.mock.calls.map(([media]) => media)).toEqual([SECOND.media]);
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

  test("exposes the preview as its shown media until the original is drawn", async() => {
    const { preview, original, current, drawn, readShownMedia } = setup();

    current.value = FIRST;
    expect(readShownMedia()).toBe(preview);
    await vi.waitFor(() => expect(drawn()).toContain(`${ORIGINAL_ORIGIN}images/1`));
    expect(readShownMedia()).toBe(original);
  });

  test("exposes the active video as its shown media", () => {
    const { root, current, readShownMedia } = setup();

    current.value = FIRST_VIDEO;
    expect(readShownMedia()).toBe(root.querySelector("video:not([hidden])"));
  });

  test("exposes the GIF as its shown media", () => {
    const { root, current, readShownMedia } = setup();

    current.value = { id: "g1", media: { kind: "gif", locator: "gifs/1.gif" } };
    expect(readShownMedia()).toBe(root.querySelector(`div:not([hidden]) > img.${LightboxRendererClass.media}`));
  });

  test("exposes no shown media once no post is shown", () => {
    const { current, readShownMedia } = setup();

    current.value = FIRST;
    current.value = undefined;
    expect(readShownMedia()).toBeUndefined();
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

describe("LightboxStageController", () => {
  test("preloads each kind's neighbors up to the neighbor limit", async() => {
    const scheduler = new MemoryScheduler();
    const decodeOriginal = vi.fn<DecodeOriginal>(() => pendForever());
    const { result: controller } = render(document, () => new LightboxStageController({ neighborLimit: 2 }, {
      resolvePreviewUrl: (media): Promise<string> => Promise.resolve(`https://preview/${media.locator}`),
      resolveOriginalUrl: (media): Promise<string> => Promise.resolve(`${ORIGINAL_ORIGIN}${media.locator}`),
      decodeOriginal,
      scheduler
    }));
    const items = Array.from({ length: 6 }, (_, index): MediaItem => ({
      id: `${index}`,
      media: { kind: index % 2 === 0 ? "image" : "video", locator: `media/${index}` }
    }));

    onTestFinished(() => controller.dispose());
    controller.updateNeighbors(items, undefined);
    scheduler.advance(200);
    await flushPromises();
    expect(decodeOriginal.mock.calls.map(([media]) => media.locator)).toEqual(["media/0", "media/2"]);
  });
});
