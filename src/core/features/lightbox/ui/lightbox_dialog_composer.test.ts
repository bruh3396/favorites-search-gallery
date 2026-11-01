import { afterEach, describe, expect, test, vi } from "vitest";
import { LightboxMediaResolver } from "@/core/features/lightbox/stage/lightbox_media_resolver";
import { LightboxMode } from "@/core/features/lightbox/lightbox_mode";
import { MemoryRemoteMedia } from "@/adapters/memory/ports/remote_media/memory_remote_media";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { LightboxViewportClass } from "@/core/features/lightbox/ui/media/lightbox_viewport";
import { MemorySizeObserver } from "@/adapters/memory/ports/size_observer/memory_size_observer";
import { Post } from "@/core/domain/post/post";
import { Signal } from "@/core/utils/reactive/signal";
import { KeyedStoredValue } from "@/core/utils/stored_value/keyed_stored_value";
import { composeLightboxDialog } from "@/core/features/lightbox/ui/lightbox_dialog_composer";
import { createPost } from "@/testing/post";
import { flushMicrotasks } from "@/testing/async";
import { render } from "@/core/ui/h/h";

const IMAGE = createPost({ id: "1", media: { kind: "image", locator: "image.jpg" } });
const LONGER_THAN_ANY_INTERVAL = 60_000;

function setup(mode: LightboxMode = "full"): {
  view: HTMLElement;
  isOpen: Signal<boolean>;
  scheduler: MemoryScheduler;
  retainedItems: Signal<readonly Post[]>;
  goToNext: () => Promise<void>;
  download: () => void;
  close: () => void;
} {
  const isOpen = new Signal(false);
  const scheduler = new MemoryScheduler();
  const retainedItems = new Signal<readonly Post[]>([]);
  const goToNext = vi.fn(() => Promise.resolve());
  const download = vi.fn();
  const close = vi.fn();
  const storage = { get: (): undefined => undefined, set: (): void => undefined };
  const remoteMedia = new MemoryRemoteMedia();
  const { result: view } = render(document, () => composeLightboxDialog<Post>({ keymap: { ArrowRight: "showNext", " ": "toggleAutoplay", d: "download" } }, {
    scheduler,
    sizeObserver: new MemorySizeObserver(),
    remoteMedia,
    lightboxMediaResolver: new LightboxMediaResolver(media => remoteMedia.resolveMedia(media)),
    lightboxActions: { openPostPage: vi.fn(), openOriginal: vi.fn(), download },
    lightboxNavigation: {
      isOpen,
      currentItem: new Signal<Post | undefined>(IMAGE),
      position: new Signal(undefined),
      goToNext,
      goToPrevious: vi.fn(() => Promise.resolve()),
      close
    },
    retainedItems,
    volume: new KeyedStoredValue({ key: "volume", defaultValue: 1 }, { storedValueStorage: storage }),
    muted: new KeyedStoredValue({ key: "muted", defaultValue: false }, { storedValueStorage: storage }),
    locateItem: () => undefined,
    mode: new Signal<LightboxMode>(mode)
  }));

  document.body.append(view);
  return { view, isOpen, scheduler, retainedItems, goToNext, download, close };
}

function pressKey(view: HTMLElement, key: string): void {
  view.dispatchEvent(new KeyboardEvent("keydown", { key }));
}

afterEach(() => {
  Reflect.deleteProperty(document, "fullscreenElement");
  Reflect.deleteProperty(document, "exitFullscreen");
  document.body.replaceChildren();
});

describe("composeLightboxDialog", () => {
  test("runs the command its keymap gives a key", () => {
    const { view, goToNext } = setup();

    pressKey(view, "ArrowRight");
    expect(goToNext).toHaveBeenCalledOnce();
  });

  test("ignores commands beyond stepping, pausing, closing and opening in simple mode", () => {
    const { view, goToNext, download } = setup("simple");

    pressKey(view, "d");
    pressKey(view, "ArrowRight");
    expect(download).not.toHaveBeenCalled();
    expect(goToNext).toHaveBeenCalledOnce();
  });

  test("closes on a press over a still in simple mode", () => {
    const { view, isOpen, close } = setup("simple");

    isOpen.value = true;
    view.querySelector(`.${LightboxViewportClass.root}`)!.dispatchEvent(
      new PointerEvent("pointerdown", { button: 0, isPrimary: true, pointerId: 1, clientX: 10, clientY: 10 })
    );
    expect(close).toHaveBeenCalledOnce();
  });

  test("holds autoplay until the media has loaded", async() => {
    const { view, scheduler, retainedItems, goToNext } = setup();

    pressKey(view, " ");
    scheduler.advance(LONGER_THAN_ANY_INTERVAL);
    expect(goToNext).not.toHaveBeenCalled();
    retainedItems.value = [IMAGE];
    await flushMicrotasks();
    scheduler.advance(LONGER_THAN_ANY_INTERVAL);
    expect(goToNext).toHaveBeenCalledOnce();
  });

  test("leaves fullscreen once the lightbox closes", () => {
    const { isOpen } = setup();
    const exitFullscreen = vi.fn(() => Promise.resolve());

    isOpen.value = true;
    Object.defineProperties(document, {
      fullscreenElement: { value: document.documentElement, configurable: true },
      exitFullscreen: { value: exitFullscreen, configurable: true }
    });
    isOpen.value = false;
    expect(exitFullscreen).toHaveBeenCalledOnce();
  });
});
