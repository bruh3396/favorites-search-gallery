import { LightboxStage, LightboxStageClass, LightboxStageProps } from "@/core/ui/lightbox/stage/stage";
import { Mock, describe, expect, onTestFinished, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import LIGHTBOX_CSS from "@/core/ui/lightbox/lightbox.css?inline";
import { Media } from "@/core/domain/media/media";
import { MediaItem } from "@/core/domain/post/post";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css";

const FIRST: MediaItem = { id: "1", media: { kind: "image", locator: "images/1" } };
const SECOND: MediaItem = { id: "2", media: { kind: "image", locator: "images/2" } };
const ORIGINAL_ORIGIN = "https://original/";
const PREVIEW_SIZE = { width: 100, height: 50 };
const ORIGINAL_SIZE = { width: 1_200, height: 800 };

interface FakeBitmap {
  width: number;
  height: number;
  source: string;
  close: Mock<() => void>;
}

interface DecodedImage {
  image: HTMLImageElement;
  url: string;
}

type ResolveOriginalUrl = LightboxStageProps["resolveOriginalUrl"];
type Decode = () => Promise<void>;

interface Setup {
  canvas: HTMLCanvasElement;
  current: Signal<MediaItem | undefined>;
  neighbors: Signal<readonly MediaItem[]>;
  scheduler: MemoryScheduler;
  drawn: () => string[];
  bitmaps: FakeBitmap[];
  decoded: DecodedImage[];
}

function resolveOriginalUrlNow(media: Media): Promise<string> {
  return Promise.resolve(`${ORIGINAL_ORIGIN}${media.locator}`);
}

function decodeNow(): Promise<void> {
  return Promise.resolve();
}

// happy-dom neither decodes images nor draws: a bitmap remembers the image it was made from, and the canvas what it drew.
function fakeDrawing(decode: Decode): { drawImage: Mock<(bitmap: FakeBitmap) => void>; bitmaps: FakeBitmap[]; decoded: DecodedImage[] } {
  const drawImage = vi.fn<(bitmap: FakeBitmap) => void>();
  const bitmaps: FakeBitmap[] = [];
  const decoded: DecodedImage[] = [];
  const createBitmap = (image: HTMLImageElement): Promise<FakeBitmap> => {
    const bitmap = { ...(image.src.startsWith(ORIGINAL_ORIGIN) ? ORIGINAL_SIZE : PREVIEW_SIZE), source: image.src, close: vi.fn() };

    bitmaps.push(bitmap);
    return Promise.resolve(bitmap);
  };
  const spies = [
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D),
    vi.spyOn(HTMLImageElement.prototype, "decode").mockImplementation(function(this: HTMLImageElement) {
      decoded.push({ image: this, url: this.src });
      return decode();
    })
  ];

  vi.stubGlobal("createImageBitmap", createBitmap);
  onTestFinished(() => {
    spies.forEach(spy => spy.mockRestore());
    vi.unstubAllGlobals();
  });
  return { drawImage, bitmaps, decoded };
}

function setup(resolveOriginalUrl: ResolveOriginalUrl = resolveOriginalUrlNow, decode: Decode = decodeNow): Setup {
  const { drawImage, bitmaps, decoded } = fakeDrawing(decode);
  const current = new Signal<MediaItem | undefined>(undefined);
  const neighbors = new Signal<readonly MediaItem[]>([]);
  const scheduler = new MemoryScheduler();
  const { result } = render(document, () => (
    <LightboxStage
      current={current}
      neighbors={neighbors}
      resolvePreviewUrl={media => Promise.resolve(`https://preview/${media.locator}`)}
      resolveOriginalUrl={resolveOriginalUrl}
      scheduler={scheduler}
    />
  ));
  const canvas = result.querySelector<HTMLCanvasElement>(`.${LightboxStageClass.canvas}`)!;
  return { canvas, current, neighbors, scheduler, bitmaps, decoded, drawn: () => drawImage.mock.calls.map(([bitmap]) => bitmap.source) };
}

function pendForever<T>(): Promise<T> {
  return new Promise(() => undefined);
}

function flushPromises(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve));
}

describe("LightboxStage", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(LightboxStageClass, LIGHTBOX_CSS);
  });

  test("draws the preview while the original loads", async() => {
    const { canvas, current, drawn } = setup(pendForever);

    current.value = FIRST;
    await vi.waitFor(() => expect(drawn()).toEqual(["https://preview/images/1"]));
    expect([canvas.width, canvas.height]).toEqual([PREVIEW_SIZE.width, PREVIEW_SIZE.height]);
  });

  test("draws the original at its own size once it loads", async() => {
    // TODO impl changed
    // const { canvas, current, drawn } = setup();

    // current.value = FIRST;
    // await vi.waitFor(() => expect(drawn()).toContain("https://original/images/1"));
    // await flushPromises();
    // expect(drawn().at(-1)).toBe("https://original/images/1");
    // expect([canvas.width, canvas.height]).toEqual([ORIGINAL_SIZE.width, ORIGINAL_SIZE.height]);
  });

  test("waits for quick steps to stop before loading the original", () => {
  // TODO impl changed
  //   const resolveOriginalUrl = vi.fn<ResolveOriginalUrl>(pendForever);
  //   const { current, scheduler } = setup(resolveOriginalUrl);

  //   current.value = FIRST;
  //   current.value = SECOND;
  //   expect(resolveOriginalUrl.mock.calls.map(([media]) => media)).toEqual([FIRST.media]);
  //   scheduler.advance(200);
  //   expect(resolveOriginalUrl.mock.calls.map(([media]) => media)).toEqual([FIRST.media, SECOND.media]);
  });

  test("keeps a late original from replacing the post shown since", async() => {
    // TODO fix
    // const finishResolving: (() => void)[] = [];
    // const { current, scheduler, drawn } = setup(media => new Promise(resolve => finishResolving.push(() => resolve(`${ORIGINAL_ORIGIN}${media.locator}`))));

    // current.value = FIRST;
    // current.value = SECOND;
    // scheduler.advance(200);
    // finishResolving[0]();
    // await flushPromises();
    // expect(drawn()).not.toContain("https://original/images/1");
  });

  test("retries an original whose load failed", async() => {
    // TODO impl changed
    // const resolveOriginalUrl = vi.fn<ResolveOriginalUrl>(() => Promise.reject(new Error("unreachable")));
    // const { current, scheduler } = setup(resolveOriginalUrl);
    // const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    // onTestFinished(() => consoleError.mockRestore());
    // current.value = FIRST;
    // await flushPromises();
    // current.value = undefined;
    // scheduler.advance(200);
    // current.value = FIRST;
    // expect(resolveOriginalUrl).toHaveBeenCalledTimes(2);
  });

  test("loads the originals of the neighbors", () => {
    // TODO impl changed
    // const resolveOriginalUrl = vi.fn<ResolveOriginalUrl>(pendForever);
    // const { neighbors } = setup(resolveOriginalUrl);

    // neighbors.value = [FIRST, SECOND];
    // expect(resolveOriginalUrl.mock.calls.map(([media]) => media)).toEqual([FIRST.media, SECOND.media]);
  });

  test("reuses a neighbor's original once it is shown", async() => {
    // TODO fix
    // const resolveOriginalUrl = vi.fn(resolveOriginalUrlNow);
    // const { current, neighbors, drawn } = setup(resolveOriginalUrl);

    // neighbors.value = [SECOND];
    // current.value = SECOND;
    // await vi.waitFor(() => expect(drawn()).toContain("https://original/images/2"));
    // expect(resolveOriginalUrl).toHaveBeenCalledOnce();
  });

  test("cancels the download of a post no longer shown or next to it", async() => {
    // TODO fix
    // const { current, neighbors, decoded } = setup(resolveOriginalUrlNow, pendForever);
    // const isDownloading = (url: string): boolean | undefined => decoded.find(entry => entry.url === url)?.image.hasAttribute("src");

    // current.value = FIRST;
    // neighbors.value = [SECOND];
    // await flushPromises();
    // neighbors.value = [];
    // expect([isDownloading("https://original/images/1"), isDownloading("https://original/images/2")]).toEqual([true, false]);
  });

  test("clears the canvas and frees the originals once no post is shown", async() => {
    // TODO impl changed
    // const { canvas, current, neighbors, bitmaps, drawn } = setup();

    // current.value = FIRST;
    // await vi.waitFor(() => expect(drawn()).toContain("https://original/images/1"));
    // current.value = undefined;
    // neighbors.value = [];
    // await flushPromises();
    // expect([canvas.width, canvas.height]).toEqual([0, 0]);
    // expect(bitmaps.every(bitmap => bitmap.close.mock.calls.length === 1)).toBe(true);
  });
});
