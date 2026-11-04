import { Lightbox, createLightbox } from "@/core/features/lightbox/lightbox";
import { Mock, afterEach, describe, expect, test, vi } from "vitest";
import { KeyedStoredValue } from "@/core/utils/storage/keyed_stored_value";
import { LightboxMode } from "@/core/features/lightbox/lightbox_mode";
import { MediaSequence } from "@/core/features/lightbox/navigation/media_sequence";
import { MemoryRemoteMedia } from "@/adapters/memory/ports/remote_media/memory_remote_media";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { MemorySizeObserver } from "@/adapters/memory/ports/size_observer/memory_size_observer";
import { MemoryViewport } from "@/adapters/memory/ports/viewport/memory_viewport";
import { Post } from "@/core/domain/post/post";
import { Signal } from "@/core/utils/reactive/signal";
import { createPost } from "@/testing/post";
import { flushMicrotasks } from "@/testing/microtask_utilities";
import { render } from "@/core/ui/h/h";

const IMAGE = createPost({ id: "1", media: { kind: "image", locator: "image.jpg" } });
const NEIGHBOR = createPost({ id: "2", media: { kind: "image", locator: "neighbor.jpg" } });
const LONGER_THAN_ANY_DELAY = 60_000;

function setup(mode: LightboxMode = "full"): {
  lightbox: Lightbox<Post>;
  scheduler: MemoryScheduler;
  remoteMedia: MemoryRemoteMedia;
  mediaSequence: MediaSequence<Post>;
  getNeighbors: Mock<MediaSequence<Post>["getNeighbors"]>;
} {
  const scheduler = new MemoryScheduler();
  const remoteMedia = new MemoryRemoteMedia();
  const storage = { get: (): undefined => undefined, set: (): void => undefined };
  const getNeighbors = vi.fn<MediaSequence<Post>["getNeighbors"]>(() => Promise.resolve([NEIGHBOR]));
  const mediaSequence: MediaSequence<Post> = {
    getNext: () => Promise.resolve(undefined),
    getPrevious: () => Promise.resolve(undefined),
    getNeighbors,
    positionOf: () => undefined
  };
  const lightbox = createLightbox<Post>({
    scheduler,
    sizeObserver: new MemorySizeObserver(),
    viewport: new MemoryViewport(),
    remoteMedia,
    actions: { openPostPage: vi.fn(), openOriginal: vi.fn(), download: vi.fn() },
    preferences: {
      mode: new Signal(mode),
      volume: new KeyedStoredValue({ key: "volume", defaultValue: 1 }, { storedValueStorage: storage }),
      muted: new KeyedStoredValue({ key: "muted", defaultValue: false }, { storedValueStorage: storage })
    },
    locateItem: () => undefined
  });
  return { lightbox, scheduler, remoteMedia, mediaSequence, getNeighbors };
}

function createView(lightbox: Lightbox<Post>): HTMLElement {
  const { result: view } = render(document, () => lightbox.createView());

  document.body.append(view);
  return view;
}

afterEach(() => {
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe("createLightbox", () => {
  test("opens on an item and reports it settled after a moment", () => {
    const { lightbox, scheduler, mediaSequence } = setup();
    const settled = vi.fn();

    lightbox.settled.on(settled);
    lightbox.open(mediaSequence, IMAGE);
    expect(lightbox.isOpen.value).toBe(true);
    scheduler.advance(LONGER_THAN_ANY_DELAY);
    expect(settled).toHaveBeenCalledWith(IMAGE);
  });

  test("reports whether it opened, and stays closed while off", () => {
    const { lightbox: fullLightbox, mediaSequence } = setup();
    const { lightbox: offLightbox } = setup("off");

    expect([fullLightbox.open(mediaSequence, IMAGE), offLightbox.open(mediaSequence, IMAGE), offLightbox.isOpen.value]).toEqual([true, false, false]);
  });

  test("loads a settled item and its neighbours", async() => {
    const { lightbox, scheduler, remoteMedia, mediaSequence } = setup();
    const decodeStill = vi.spyOn(remoteMedia, "decodeStill");

    createView(lightbox);
    lightbox.open(mediaSequence, IMAGE);
    scheduler.advance(LONGER_THAN_ANY_DELAY);
    await flushMicrotasks();
    expect(decodeStill).toHaveBeenNthCalledWith(1, IMAGE.media, expect.any(AbortSignal));
    expect(decodeStill).toHaveBeenNthCalledWith(2, NEIGHBOR.media, expect.any(AbortSignal));
  });

  test("loads a prefetched item before it is opened", async() => {
    const { lightbox, remoteMedia } = setup();
    const decodeStill = vi.spyOn(remoteMedia, "decodeStill");

    createView(lightbox);
    lightbox.prefetch(IMAGE);
    await flushMicrotasks();
    expect(decodeStill).toHaveBeenCalledWith(IMAGE.media, expect.any(AbortSignal));
  });

  test("closes from its view and reports the item it closed on", () => {
    const { lightbox, mediaSequence } = setup();
    const closed = vi.fn();
    const view = createView(lightbox);

    lightbox.closed.on(closed);
    lightbox.open(mediaSequence, IMAGE);
    view.dispatchEvent(new MouseEvent("mousedown", { button: 2, bubbles: true, view: window }));
    expect(lightbox.isOpen.value).toBe(false);
    expect(closed).toHaveBeenCalledWith(IMAGE);
  });

  describe("dispose", () => {
    test("closes, drops the pending settle, and stops loading neighbours", () => {
      const { lightbox, scheduler, mediaSequence, getNeighbors } = setup();
      const settled = vi.fn();

      lightbox.settled.on(settled);
      lightbox.open(mediaSequence, IMAGE);
      lightbox.dispose();
      expect(lightbox.isOpen.value).toBe(false);
      lightbox.open(mediaSequence, IMAGE);
      scheduler.advance(LONGER_THAN_ANY_DELAY);
      expect(settled).toHaveBeenCalledOnce();
      expect(getNeighbors).not.toHaveBeenCalled();
    });
  });
});
