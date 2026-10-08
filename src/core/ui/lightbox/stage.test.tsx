import { LightboxStage, LightboxStageClass, LightboxStageProps } from "@/core/ui/lightbox/stage";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { Media } from "@/core/domain/media/media";
import { MediaItem } from "@/core/domain/post/post";
import LIGHTBOX_CSS from "@/core/ui/lightbox/lightbox.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css";

const FIRST: MediaItem = { id: "1", media: { kind: "image", locator: "images/1" } };
const SECOND: MediaItem = { id: "2", media: { kind: "image", locator: "images/2" } };

interface Setup {
  image: HTMLImageElement;
  current: Signal<MediaItem | undefined>;
  neighbors: Signal<readonly MediaItem[]>;
}

function resolvePreviewUrl(media: Media): Promise<string> {
  return Promise.resolve(`https://preview/${media.locator}`);
}

function resolveOriginalUrl(media: Media): Promise<string> {
  return Promise.resolve(`https://original/${media.locator}`);
}

function setup(options: Partial<Pick<LightboxStageProps, "resolveOriginalUrl">> = {}): Setup {
  const current = new Signal<MediaItem | undefined>(undefined);
  const neighbors = new Signal<readonly MediaItem[]>([]);
  const { result } = render(document, () => (
    <LightboxStage current={current} neighbors={neighbors} resolvePreviewUrl={resolvePreviewUrl} resolveOriginalUrl={resolveOriginalUrl} {...options} />
  ));
  const image = result.querySelector<HTMLImageElement>(`.${LightboxStageClass.image}`)!;
  return { image, current, neighbors };
}

describe("LightboxStage", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(LightboxStageClass, LIGHTBOX_CSS);
  });

  test("keeps its image from being dragged", () => {
    expect(setup().image.draggable).toBe(false);
  });

  test("shows the preview while the original loads", async() => {
    const { image, current } = setup({ resolveOriginalUrl: () => new Promise(() => undefined) });

    current.value = FIRST;
    await vi.waitFor(() => expect(image.src).toBe("https://preview/images/1"));
  });

  test("swaps in the original once it loads", async() => {
    const { image, current } = setup();

    current.value = FIRST;
    await vi.waitFor(() => expect(image.src).toBe("https://original/images/1"));
  });

  test("keeps a late original from replacing the post shown since", async() => {
    const finishLoading: ((url: string) => void)[] = [];
    const { image, current } = setup({ resolveOriginalUrl: () => new Promise(resolve => finishLoading.push(resolve)) });

    current.value = FIRST;
    await vi.waitFor(() => expect(finishLoading).toHaveLength(1));
    current.value = SECOND;
    await vi.waitFor(() => expect(image.src).toBe("https://preview/images/2"));
    finishLoading[0]("https://original/images/1");
    await new Promise(resolve => setTimeout(resolve));
    expect(image.src).toBe("https://preview/images/2");
  });

  test("loads the originals of the neighbors", async() => {
    const resolve = vi.fn(resolveOriginalUrl);
    const { neighbors } = setup({ resolveOriginalUrl: resolve });

    neighbors.value = [FIRST, SECOND];
    await vi.waitFor(() => expect(resolve.mock.calls.map(([media]) => media)).toEqual([FIRST.media, SECOND.media]));
  });

  test("decodes the neighbors' originals off the page", async() => {
    const created: HTMLImageElement[] = [];
    const createElement = document.createElement.bind(document);
    const spy = vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      const element = createElement(tagName);

      if (element instanceof HTMLImageElement) {
        created.push(element);
      }
      return element;
    });
    const { neighbors } = setup();

    onTestFinished(() => spy.mockRestore());
    neighbors.value = [FIRST, SECOND];
    await vi.waitFor(() => expect(created.map(image => image.src)).toEqual(expect.arrayContaining(["https://original/images/1", "https://original/images/2"])));
    expect(created.every(image => !image.isConnected)).toBe(true);
  });

  test("clears the image once no post is shown", async() => {
    const { image, current } = setup();

    current.value = FIRST;
    await vi.waitFor(() => expect(image.src).toBe("https://original/images/1"));
    current.value = undefined;
    expect(image.hasAttribute("src")).toBe(false);
  });
});
