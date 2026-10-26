import { Lightbox, createLightbox } from "@/core/features/lightbox/lightbox";
import { Mock, afterEach, describe, expect, test, vi } from "vitest";
import { LightboxMode } from "@/core/features/lightbox/lightbox_mode";
import { MediaSequence } from "@/core/domain/media/media_sequence";
import { MemoryRemoteMedia } from "@/adapters/memory/ports/remote_media/remote_media";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { MemorySizeObserver } from "@/adapters/memory/ports/size_observer/size_observer";
import { Post } from "@/core/domain/post/post";
import { Signal } from "@/core/utils/reactive/signal";
import { StoredPreference } from "@/core/utils/preference/stored_preference";
import { createPost } from "@/testing/post";
import { flushMicrotasks } from "@/testing/async";
import { render } from "@/core/ui/h/h";

const IMAGE = createPost({ id: "1", media: { kind: "image", locator: "image.jpg" } });
const NEIGHBOR = createPost({ id: "2", media: { kind: "image", locator: "neighbor.jpg" } });
const LONGER_THAN_ANY_DELAY = 60_000;

function setup(mode: LightboxMode = "full"): {
  lightbox: Lightbox<Post>;
  scheduler: MemoryScheduler;
  remoteMedia: MemoryRemoteMedia;
  sequence: MediaSequence<Post>;
  getNeighbors: Mock<MediaSequence<Post>["getNeighbors"]>;
} {
  const scheduler = new MemoryScheduler();
  const remoteMedia = new MemoryRemoteMedia();
  const storage = { get: (): undefined => undefined, set: (): void => undefined };
  const getNeighbors = vi.fn<MediaSequence<Post>["getNeighbors"]>(() => Promise.resolve([NEIGHBOR]));
  const sequence: MediaSequence<Post> = {
    getNext: () => Promise.resolve(undefined),
    getPrevious: () => Promise.resolve(undefined),
    getNeighbors,
    positionOf: () => undefined
  };
  const lightbox = createLightbox<Post>({
    scheduler,
    sizeObserver: new MemorySizeObserver(),
    remoteMedia,
    actions: { openPostPage: vi.fn(), openOriginal: vi.fn(), download: vi.fn() },
    volume: new StoredPreference({ key: "volume", defaultValue: 1 }, { storage }),
    muted: new StoredPreference({ key: "muted", defaultValue: false }, { storage }),
    locateItem: () => undefined,
    mode: new Signal(mode)
  });
  return { lightbox, scheduler, remoteMedia, sequence, getNeighbors };
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
    const { lightbox, scheduler, sequence } = setup();
    const settled = vi.fn();

    lightbox.settled.on(settled);
    lightbox.open(sequence, IMAGE);
    expect(lightbox.isOpen.value).toBe(true);
    scheduler.advance(LONGER_THAN_ANY_DELAY);
    expect(settled).toHaveBeenCalledWith(IMAGE);
  });

  test("reports whether it opened, and stays closed while off", () => {
    const { lightbox: full, sequence } = setup();
    const { lightbox: off } = setup("off");

    expect([full.open(sequence, IMAGE), off.open(sequence, IMAGE), off.isOpen.value]).toEqual([true, false, false]);
  });

  test("loads a settled item and its neighbours", async() => {
    const { lightbox, scheduler, remoteMedia, sequence } = setup();
    const decodeStill = vi.spyOn(remoteMedia, "decodeStill");

    createView(lightbox);
    lightbox.open(sequence, IMAGE);
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
    const { lightbox, sequence } = setup();
    const closed = vi.fn();
    const view = createView(lightbox);

    lightbox.closed.on(closed);
    lightbox.open(sequence, IMAGE);
    view.dispatchEvent(new MouseEvent("mousedown", { button: 2, bubbles: true, view: window }));
    expect(lightbox.isOpen.value).toBe(false);
    expect(closed).toHaveBeenCalledWith(IMAGE);
  });

  describe("dispose", () => {
    test("closes, drops the pending settle, and stops loading neighbours", () => {
      const { lightbox, scheduler, sequence, getNeighbors } = setup();
      const settled = vi.fn();

      lightbox.settled.on(settled);
      lightbox.open(sequence, IMAGE);
      lightbox.dispose();
      expect(lightbox.isOpen.value).toBe(false);
      lightbox.open(sequence, IMAGE);
      scheduler.advance(LONGER_THAN_ANY_DELAY);
      expect(settled).toHaveBeenCalledOnce();
      expect(getNeighbors).not.toHaveBeenCalled();
    });
  });
});
