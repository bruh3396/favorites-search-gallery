import { LightboxStage, LightboxStageClass, LightboxStageProps } from "@/core/features/lightbox/ui/stage/stage";
import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { Media } from "@/core/domain/media/media";
import { MediaItem } from "@/core/domain/post/post";
import { Signal } from "@/core/utils/reactive/signal";

const FIRST: MediaItem = { id: "1", media: { kind: "image", locator: "images/1" } };
const SECOND: MediaItem = { id: "2", media: { kind: "image", locator: "images/2" } };

interface Setup {
  image: HTMLImageElement;
  current: Signal<MediaItem | undefined>;
}

function resolvePreviewUrl(media: Media): Promise<string> {
  return Promise.resolve(`https://preview/${media.locator}`);
}

function resolveOriginalUrl(media: Media): Promise<string> {
  return Promise.resolve(`https://original/${media.locator}`);
}

function setup(options: Partial<Pick<LightboxStageProps, "resolveOriginalUrl">> = {}): Setup {
  const current = new Signal<MediaItem | undefined>(undefined);
  const { result } = render(document, () => (
    <LightboxStage current={current} resolvePreviewUrl={resolvePreviewUrl} resolveOriginalUrl={resolveOriginalUrl} {...options} />
  ));
  const image = result.querySelector<HTMLImageElement>(`.${LightboxStageClass.image}`)!;
  return { image, current };
}

describe("LightboxStage", () => {
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

  test("clears the image once no post is shown", async() => {
    const { image, current } = setup();

    current.value = FIRST;
    await vi.waitFor(() => expect(image.src).toBe("https://original/images/1"));
    current.value = undefined;
    expect(image.hasAttribute("src")).toBe(false);
  });
});
