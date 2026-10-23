import { afterEach, describe, expect, test, vi } from "vitest";
import { MemoryRemoteMedia } from "@/adapters/memory/ports/remote_media/remote_media";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { MemorySizeObserver } from "@/adapters/memory/ports/size_observer/size_observer";
import { Post } from "@/core/domain/post/post";
import { Signal } from "@/core/utils/reactive/signal";
import { StoredPreference } from "@/core/utils/reactive/preference";
import { createLightboxView } from "@/core/features/lightbox/view/view";
import { createPost } from "@/testing/post";
import { flushMicrotasks } from "@/testing/async";
import { render } from "@/core/ui/h/h";

const IMAGE = createPost({ id: "1", media: { kind: "image", locator: "image.jpg" } });
const LONGER_THAN_ANY_INTERVAL = 60_000;

function setup(): {
  view: HTMLElement;
  isOpen: Signal<boolean>;
  scheduler: MemoryScheduler;
  retainedItems: Signal<readonly Post[]>;
  goToNext: () => Promise<void>;
} {
  const isOpen = new Signal(false);
  const scheduler = new MemoryScheduler();
  const retainedItems = new Signal<readonly Post[]>([]);
  const goToNext = vi.fn(() => Promise.resolve());
  const storage = { get: (): undefined => undefined, set: (): void => undefined };
  const { result: view } = render(document, () => createLightboxView<Post>({ keymap: { ArrowRight: "showNext", " ": "toggleAutoplay" } }, {
    scheduler,
    sizeObserver: new MemorySizeObserver(),
    remoteMedia: new MemoryRemoteMedia(),
    actions: { openPostPage: vi.fn(), openOriginal: vi.fn(), download: vi.fn() },
    navigation: {
      isOpen,
      currentItem: new Signal<Post | undefined>(IMAGE),
      position: new Signal(undefined),
      goToNext,
      goToPrevious: vi.fn(() => Promise.resolve()),
      close: vi.fn()
    },
    retainedItems,
    volume: new StoredPreference({ key: "volume", defaultValue: 1 }, { storage }),
    muted: new StoredPreference({ key: "muted", defaultValue: false }, { storage }),
    locateItem: () => undefined
  }));

  document.body.append(view);
  return { view, isOpen, scheduler, retainedItems, goToNext };
}

function pressKey(view: HTMLElement, key: string): void {
  view.dispatchEvent(new KeyboardEvent("keydown", { key }));
}

afterEach(() => {
  Reflect.deleteProperty(document, "fullscreenElement");
  Reflect.deleteProperty(document, "exitFullscreen");
  document.body.replaceChildren();
});

describe("createLightboxView", () => {
  test("runs the command its keymap gives a key", () => {
    const { view, goToNext } = setup();

    pressKey(view, "ArrowRight");
    expect(goToNext).toHaveBeenCalledOnce();
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
