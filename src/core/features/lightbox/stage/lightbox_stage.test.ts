import { LightboxStage, LightboxStageDependencies } from "@/core/features/lightbox/stage/lightbox_stage";
import { Mock, afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { LightboxMediaResolver } from "@/core/features/lightbox/stage/lightbox_media_resolver";
import { Media } from "@/core/domain/media/media";
import { Post } from "@/core/domain/post/post";
import { Signal } from "@/core/utils/reactive/signal";
import { StoredValue } from "@/core/utils/storage/stored_value";
import { createPost } from "@/testing/post";
import { createStoredValue } from "@/testing/stored_value";
import { flushMicrotasks } from "@/testing/microtask_utilities";
import { render } from "@/core/ui/h/h";

const IMAGE = createPost({ id: "1", media: { kind: "image", locator: "image.jpg" } });
const GIF = createPost({ id: "2", media: { kind: "gif", locator: "animation.gif" } });
const VIDEO = createPost({ id: "3", media: { kind: "video", locator: "clip.mp4" } });
const OTHER_VIDEO = createPost({ id: "4", media: { kind: "video", locator: "other.mp4" } });

type RemoteMedia = LightboxStageDependencies<Post>["remoteMedia"];

function createGif(media: Media): HTMLImageElement {
  const gif = document.createElement("img");

  gif.src = media.locator;
  Object.defineProperties(gif, { naturalWidth: { value: 80 }, naturalHeight: { value: 60 } });
  return gif;
}

function resolveAsGiven(media: Media): Promise<Media> {
  return Promise.resolve(media);
}

function setup(
  currentPost: Post | undefined,
  retainedPosts: readonly Post[] = currentPost === undefined ? [] : [currentPost],
  resolveMedia: (media: Media) => Promise<Media> = resolveAsGiven
): {
  lightboxStage: LightboxStage<Post>;
  dispose: () => void;
  currentItem: Signal<Post | undefined>;
  retainedItems: Signal<readonly Post[]>;
  volume: StoredValue<number>;
  muted: StoredValue<boolean>;
  closeBitmap: Mock<() => void>;
  resolveStill: () => void;
} {
  const closeBitmap = vi.fn<() => void>();
  let resolveStill = (): void => undefined;
  const lightboxMediaResolver = new LightboxMediaResolver(resolveMedia);
  const remoteMedia: RemoteMedia = {
    resolvePreviewUrl: media => `preview/${media.locator}`,
    resolveOriginalUrl: media => Promise.resolve(`https://example.com/${media.locator}`),
    decodeStill: () => new Promise(resolve => {
      resolveStill = (): void => resolve({ width: 40, height: 30, close: closeBitmap } as unknown as ImageBitmap);
    }),
    loadOriginal: media => Promise.resolve(createGif(media))
  };
  const currentItem = new Signal<Post | undefined>(currentPost);
  const retainedItems = new Signal<readonly Post[]>(retainedPosts);
  const volume = createStoredValue(0.5);
  const muted = createStoredValue(true);
  const { result: lightboxStage, dispose } = render(document, () => new LightboxStage(
    { gifCapacity: 2, videoCapacity: 2 },
    { remoteMedia, lightboxMediaResolver, currentItem, retainedItems, volume, muted }
  ));
  return { lightboxStage, dispose, currentItem, retainedItems, volume, muted, closeBitmap, resolveStill: () => resolveStill() };
}

async function setupLoaded(currentPost: Post, retainedPosts?: readonly Post[]): Promise<ReturnType<typeof setup>> {
  const result = setup(currentPost, retainedPosts);

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
    const { lightboxStage } = setup(undefined);

    expect([lightboxStage.shownMedia.value, lightboxStage.mediaSize.value, lightboxStage.previewUrl.value]).toEqual([undefined, undefined, undefined]);
  });

  test("shows the current image once decoded, at the bitmap's size", async() => {
    const { lightboxStage, closeBitmap } = await setupLoaded(IMAGE);
    const image = lightboxStage.image.value!;

    expect([image.width, image.height]).toEqual([40, 30]);
    expect(lightboxStage.shownMedia.value).toBe(image);
    expect(lightboxStage.mediaSize.value).toEqual({ width: 40, height: 30 });
    expect(closeBitmap).toHaveBeenCalledOnce();
  });

  test("shows the current gif at its natural size", async() => {
    const { lightboxStage } = await setupLoaded(GIF);

    expect(lightboxStage.gif.value?.getAttribute("src")).toBe("animation.gif");
    expect(lightboxStage.shownMedia.value).toBe(lightboxStage.gif.value);
    expect(lightboxStage.mediaSize.value).toEqual({ width: 80, height: 60 });
  });

  test("shows the current video at the preferred volume, without a size", async() => {
    const { lightboxStage } = await setupLoaded(VIDEO);
    const video = lightboxStage.video.value!;

    expect(video.getAttribute("src")).toBe("https://example.com/clip.mp4");
    expect([video.volume, video.muted]).toEqual([0.5, true]);
    expect(lightboxStage.shownMedia.value).toBe(video);
    expect(lightboxStage.mediaSize.value).toBeUndefined();
  });

  test("shows videos looping, with controls but no fullscreen button", async() => {
    const { lightboxStage } = await setupLoaded(VIDEO);
    const video = lightboxStage.video.value!;

    expect([video.controls, video.loop, video.preload]).toEqual([true, true, "auto"]);
    expect(video.getAttribute("controlsList")).toBe("nofullscreen");
  });

  test("shows the preview until the image covers it", async() => {
    const { lightboxStage, resolveStill } = setup(IMAGE);

    await flushMicrotasks();
    expect(lightboxStage.previewUrl.value).toBe("preview/image.jpg");
    expect(lightboxStage.shownPreviewUrl.value).toBe("preview/image.jpg");
    resolveStill();
    await flushMicrotasks();
    expect(lightboxStage.shownPreviewUrl.value).toBeUndefined();
    expect(lightboxStage.previewUrl.value).toBe("preview/image.jpg");
  });

  test("hides the preview behind a video before it loads", async() => {
    const { lightboxStage } = setup(VIDEO, []);

    await flushMicrotasks();
    expect(lightboxStage.previewUrl.value).toBe("preview/clip.mp4");
    expect(lightboxStage.shownPreviewUrl.value).toBeUndefined();
  });

  test("shows the kind its media resolves to", async() => {
    const untaggedPost = createPost({ id: "5", media: { kind: "image", locator: "animation" } });
    const { lightboxStage } = setup(untaggedPost, [untaggedPost], () => Promise.resolve({ kind: "gif", locator: "animation.gif" }));

    await flushMicrotasks();
    expect(lightboxStage.gif.value?.getAttribute("src")).toBe("animation.gif");
    expect(lightboxStage.image.value).toBeUndefined();
  });

  test("plays a video its media resolves to, without the preview", async() => {
    const untaggedPost = createPost({ id: "6", media: { kind: "image", locator: "clip" } });
    const { lightboxStage } = setup(untaggedPost, [untaggedPost], () => Promise.resolve({ kind: "video", locator: "clip.mp4" }));

    await flushMicrotasks();
    expect(lightboxStage.video.value?.getAttribute("src")).toBe("https://example.com/clip.mp4");
    expect(lightboxStage.shownPreviewUrl.value).toBeUndefined();
    expect(lightboxStage.image.value).toBeUndefined();
  });

  test("loads nothing until its media resolves", async() => {
    const { lightboxStage } = setup(VIDEO, [VIDEO], () => new Promise(() => undefined));

    await flushMicrotasks();
    expect([lightboxStage.image.value, lightboxStage.gif.value, lightboxStage.video.value]).toEqual([undefined, undefined, undefined]);
    expect(lightboxStage.shownPreviewUrl.value).toBe("preview/clip.mp4");
  });

  test("shows only what it retains", async() => {
    const { lightboxStage, currentItem, resolveStill } = setup(GIF, [IMAGE, GIF]);

    await flushMicrotasks();
    resolveStill();
    await flushMicrotasks();
    expect(lightboxStage.gif.value).toBeDefined();
    currentItem.value = IMAGE;
    expect(lightboxStage.image.value).toBeDefined();
    expect(lightboxStage.gif.value).toBeUndefined();
  });

  test("releases the media it stops retaining", async() => {
    const { lightboxStage, retainedItems } = await setupLoaded(IMAGE);
    const image = lightboxStage.image.value!;

    retainedItems.value = [];
    expect(lightboxStage.image.value).toBeUndefined();
    expect([image.width, image.height]).toEqual([0, 0]);
  });

  test("releases everything once its scope is disposed", async() => {
    const image = await setupLoaded(IMAGE);
    const gif = await setupLoaded(GIF);
    const video = await setupLoaded(VIDEO);
    const [canvas, gifElement, videoElement] = [image.lightboxStage.image.value!, gif.lightboxStage.gif.value!, video.lightboxStage.video.value!];

    image.dispose();
    gif.dispose();
    video.dispose();
    expect([canvas.width, gifElement.hasAttribute("src"), videoElement.hasAttribute("src")]).toEqual([0, false, false]);
  });

  test("saves volume changes made on the shown video", async() => {
    const { lightboxStage, volume, muted } = await setupLoaded(VIDEO);
    const video = lightboxStage.video.value!;

    Object.defineProperties(video, { volume: { value: 0.2, writable: true }, muted: { value: false, writable: true } });
    video.dispatchEvent(new Event("volumechange"));
    expect([volume.peek(), muted.peek()]).toEqual([0.2, false]);
  });

  test("ignores volume changes on a video it isn't showing", async() => {
    const { lightboxStage, currentItem, volume } = await setupLoaded(VIDEO, [VIDEO, OTHER_VIDEO]);

    currentItem.value = OTHER_VIDEO;
    const hidden = lightboxStage.video.value!;

    currentItem.value = VIDEO;
    hidden.volume = 0.2;
    hidden.dispatchEvent(new Event("volumechange"));
    expect(volume.peek()).toBe(0.5);
  });

  describe("toggleMute", () => {
    test("flips the muted preference while showing a video", async() => {
      const { lightboxStage, muted } = await setupLoaded(VIDEO);

      lightboxStage.toggleMute();
      expect(muted.peek()).toBe(false);
      expect(lightboxStage.video.value?.muted).toBe(false);
    });

    test("does nothing without a video", async() => {
      const { lightboxStage, muted } = await setupLoaded(IMAGE);

      lightboxStage.toggleMute();
      expect(muted.peek()).toBe(true);
    });
  });

  describe("togglePause", () => {
    test("plays a paused video", async() => {
      const { lightboxStage } = await setupLoaded(VIDEO);

      lightboxStage.togglePause();
      expect(lightboxStage.video.value?.play).toHaveBeenCalledOnce();
    });

    test("pauses a playing video", async() => {
      const { lightboxStage } = await setupLoaded(VIDEO);
      const video = lightboxStage.video.value!;
      const pause = vi.spyOn(video, "pause");

      Object.defineProperty(video, "paused", { value: false });
      lightboxStage.togglePause();
      expect(pause).toHaveBeenCalledOnce();
    });

    test("does nothing without a video", async() => {
      const { lightboxStage } = await setupLoaded(IMAGE);

      lightboxStage.togglePause();
      expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
    });
  });
});
