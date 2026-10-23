import { LightboxStage, LightboxStageDependencies } from "@/core/features/lightbox/stage/stage";
import { Mock, afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { Emitter } from "@/core/utils/reactive/emitter";
import { Media } from "@/core/domain/media/media";
import { Post } from "@/core/domain/post/post";
import { Preference } from "@/core/utils/reactive/preference";
import { Signal } from "@/core/utils/reactive/signal";
import { createPost } from "@/testing/post";
import { flushMicrotasks } from "@/testing/async";
import { render } from "@/core/ui/h/h";

const IMAGE = createPost({ id: "1", media: { kind: "image", locator: "image.jpg" } });
const GIF = createPost({ id: "2", media: { kind: "gif", locator: "animation.gif" } });
const VIDEO = createPost({ id: "3", media: { kind: "video", locator: "clip.mp4" } });
const OTHER_VIDEO = createPost({ id: "4", media: { kind: "video", locator: "other.mp4" } });

type RemoteMedia = LightboxStageDependencies<Post>["remoteMedia"];

function createPreference<T>(initial: T): Preference<T> {
  const current = new Signal(initial);
  return {
    get value(): T {
      return current.value;
    },
    peek: () => current.peek(),
    set: (value: T): void => {
      current.value = value;
    },
    changed: new Emitter<T>()
  };
}

function createGif(media: Media): HTMLImageElement {
  const gif = document.createElement("img");

  gif.src = media.locator;
  Object.defineProperties(gif, { naturalWidth: { value: 80 }, naturalHeight: { value: 60 } });
  return gif;
}

function setup(current: Post | undefined, retained: readonly Post[] = current === undefined ? [] : [current]): {
  stage: LightboxStage<Post>;
  dispose: () => void;
  currentItem: Signal<Post | undefined>;
  retainedItems: Signal<readonly Post[]>;
  volume: Preference<number>;
  muted: Preference<boolean>;
  closeBitmap: Mock<() => void>;
  resolveStill: () => void;
} {
  const closeBitmap = vi.fn<() => void>();
  let resolveStill = (): void => undefined;
  const remoteMedia: RemoteMedia = {
    resolvePreviewUrl: media => Promise.resolve(`preview/${media.locator}`),
    resolveOriginalUrl: media => Promise.resolve(`https://example.com/${media.locator}`),
    decodeStill: () => new Promise(resolve => {
      resolveStill = (): void => resolve({ width: 40, height: 30, close: closeBitmap } as unknown as ImageBitmap);
    }),
    loadOriginal: media => Promise.resolve(createGif(media))
  };
  const currentItem = new Signal<Post | undefined>(current);
  const retainedItems = new Signal<readonly Post[]>(retained);
  const volume = createPreference(0.5);
  const muted = createPreference(true);
  const { result: stage, dispose } = render(document, () => new LightboxStage(
    { gifCapacity: 2, videoCapacity: 2 },
    { remoteMedia, currentItem, retainedItems, volume, muted }
  ));
  return { stage, dispose, currentItem, retainedItems, volume, muted, closeBitmap, resolveStill: () => resolveStill() };
}

async function setupLoaded(current: Post, retained?: readonly Post[]): Promise<ReturnType<typeof setup>> {
  const result = setup(current, retained);

  await flushMicrotasks();
  result.resolveStill();
  await flushMicrotasks();
  return result;
}

beforeEach(() => {
  vi.spyOn(HTMLImageElement.prototype, "decode").mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("LightboxStage", () => {
  test("shows nothing without a current item", () => {
    const { stage } = setup(undefined);

    expect([stage.shownMedia.value, stage.mediaSize.value, stage.previewUrl.value]).toEqual([undefined, undefined, undefined]);
  });

  test("shows the current image once decoded, at the bitmap's size", async() => {
    const { stage, closeBitmap } = await setupLoaded(IMAGE);
    const image = stage.image.value!;

    expect([image.width, image.height]).toEqual([40, 30]);
    expect(stage.shownMedia.value).toBe(image);
    expect(stage.mediaSize.value).toEqual({ width: 40, height: 30 });
    expect(closeBitmap).toHaveBeenCalledOnce();
  });

  test("shows the current gif at its natural size", async() => {
    const { stage } = await setupLoaded(GIF);

    expect(stage.gif.value?.getAttribute("src")).toBe("animation.gif");
    expect(stage.shownMedia.value).toBe(stage.gif.value);
    expect(stage.mediaSize.value).toEqual({ width: 80, height: 60 });
  });

  test("shows the current video at the preferred volume, without a size", async() => {
    const { stage } = await setupLoaded(VIDEO);
    const video = stage.video.value!;

    expect(video.getAttribute("src")).toBe("https://example.com/clip.mp4");
    expect([video.volume, video.muted]).toEqual([0.5, true]);
    expect(stage.shownMedia.value).toBe(video);
    expect(stage.mediaSize.value).toBeUndefined();
  });

  test("shows the preview until the image covers it", async() => {
    const { stage, resolveStill } = setup(IMAGE);

    await flushMicrotasks();
    expect(stage.previewUrl.value).toBe("preview/image.jpg");
    expect(stage.shownPreviewUrl.value).toBe("preview/image.jpg");
    resolveStill();
    await flushMicrotasks();
    expect(stage.shownPreviewUrl.value).toBeUndefined();
    expect(stage.previewUrl.value).toBe("preview/image.jpg");
  });

  test("hides the preview behind a video before it loads", async() => {
    const { stage } = setup(VIDEO, []);

    await flushMicrotasks();
    expect(stage.previewUrl.value).toBe("preview/clip.mp4");
    expect(stage.shownPreviewUrl.value).toBeUndefined();
  });

  test("shows only what it retains", async() => {
    const { stage, currentItem, resolveStill } = setup(GIF, [IMAGE, GIF]);

    await flushMicrotasks();
    resolveStill();
    await flushMicrotasks();
    expect(stage.gif.value).toBeDefined();
    currentItem.value = IMAGE;
    expect(stage.image.value).toBeDefined();
    expect(stage.gif.value).toBeUndefined();
  });

  test("releases the media it stops retaining", async() => {
    const { stage, retainedItems } = await setupLoaded(IMAGE);
    const image = stage.image.value!;

    retainedItems.value = [];
    expect(stage.image.value).toBeUndefined();
    expect([image.width, image.height]).toEqual([0, 0]);
  });

  test("releases everything once its scope is disposed", async() => {
    const image = await setupLoaded(IMAGE);
    const gif = await setupLoaded(GIF);
    const video = await setupLoaded(VIDEO);
    const [canvas, gifElement, videoElement] = [image.stage.image.value!, gif.stage.gif.value!, video.stage.video.value!];

    image.dispose();
    gif.dispose();
    video.dispose();
    expect([canvas.width, gifElement.hasAttribute("src"), videoElement.hasAttribute("src")]).toEqual([0, false, false]);
  });

  test("saves volume changes made on the shown video", async() => {
    const { stage, volume, muted } = await setupLoaded(VIDEO);
    const video = stage.video.value!;

    Object.defineProperties(video, { volume: { value: 0.2, writable: true }, muted: { value: false, writable: true } });
    video.dispatchEvent(new Event("volumechange"));
    expect([volume.peek(), muted.peek()]).toEqual([0.2, false]);
  });

  test("ignores volume changes on a video it isn't showing", async() => {
    const { stage, currentItem, volume } = await setupLoaded(VIDEO, [VIDEO, OTHER_VIDEO]);

    currentItem.value = OTHER_VIDEO;
    const hidden = stage.video.value!;

    currentItem.value = VIDEO;
    hidden.volume = 0.2;
    hidden.dispatchEvent(new Event("volumechange"));
    expect(volume.peek()).toBe(0.5);
  });

  describe("toggleMute", () => {
    test("flips the muted preference while showing a video", async() => {
      const { stage, muted } = await setupLoaded(VIDEO);

      stage.toggleMute();
      expect(muted.peek()).toBe(false);
      expect(stage.video.value?.muted).toBe(false);
    });

    test("does nothing without a video", async() => {
      const { stage, muted } = await setupLoaded(IMAGE);

      stage.toggleMute();
      expect(muted.peek()).toBe(true);
    });
  });

  describe("togglePause", () => {
    test("plays a paused video", async() => {
      const { stage } = await setupLoaded(VIDEO);

      stage.togglePause();
      expect(stage.video.value?.play).toHaveBeenCalledOnce();
    });

    test("pauses a playing video", async() => {
      const { stage } = await setupLoaded(VIDEO);
      const video = stage.video.value!;
      const pause = vi.spyOn(video, "pause");

      Object.defineProperty(video, "paused", { value: false });
      stage.togglePause();
      expect(pause).toHaveBeenCalledOnce();
    });

    test("does nothing without a video", async() => {
      const { stage } = await setupLoaded(IMAGE);

      stage.togglePause();
      expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
    });
  });
});
