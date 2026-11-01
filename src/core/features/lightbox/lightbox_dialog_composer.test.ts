import { afterEach, describe, expect, test, vi } from "vitest";
import { KeyedStoredValue } from "@/core/utils/storage/keyed_stored_value";
import { LightboxDetails } from "@/core/features/lightbox/details/lightbox_details";
import { LightboxDetailsPanelClass } from "@/core/features/lightbox/details/lightbox_details_panel";
import { LightboxMediaResolver } from "@/core/features/lightbox/media/lightbox_media_resolver";
import { LightboxMode } from "@/core/features/lightbox/lightbox_mode";
import { LightboxVideoClass } from "@/core/features/lightbox/media/lightbox_video";
import { LightboxViewportClass } from "@/core/features/lightbox/zoom/lightbox_viewport";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/memory_local_keyed_values";
import { MemoryRemoteMedia } from "@/adapters/memory/ports/remote_media/memory_remote_media";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { MemorySizeObserver } from "@/adapters/memory/ports/size_observer/memory_size_observer";
import { MemoryViewport } from "@/adapters/memory/ports/viewport/memory_viewport";
import { Post } from "@/core/domain/post/post";
import { Signal } from "@/core/utils/reactive/signal";
import { composeLightboxDialog } from "@/core/features/lightbox/lightbox_dialog_composer";
import { createPost } from "@/testing/post";
import { flushMicrotasks } from "@/testing/microtask_utilities";
import { render } from "@/core/ui/h/h";

const IMAGE = createPost({ id: "1", media: { kind: "image", locator: "image.jpg" } });
const LONGER_THAN_ANY_INTERVAL = 60_000;

function setup(
  mode: LightboxMode = "full",
  locateItem: (post: Post) => Element | undefined = () => undefined,
  lightboxDetails?: LightboxDetails<Post>
): {
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
    viewport: new MemoryViewport(),
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
    lightboxPreferences: {
      mode: new Signal<LightboxMode>(mode),
      volume: new KeyedStoredValue({ key: "volume", defaultValue: 1 }, { storedValueStorage: storage }),
      muted: new KeyedStoredValue({ key: "muted", defaultValue: false }, { storedValueStorage: storage })
    },
    locateItem,
    lightboxDetails
  }));

  document.body.append(view);
  return { view, isOpen, scheduler, retainedItems, goToNext, download, close };
}

function pressKey(view: HTMLElement, key: string): void {
  view.dispatchEvent(new KeyboardEvent("keydown", { key }));
}

function createDetails(): LightboxDetails<Post> & { isOpen: KeyedStoredValue<boolean> } {
  return {
    isOpen: new KeyedStoredValue({ key: "detailsOpen", defaultValue: false }, { storedValueStorage: new MemoryLocalKeyedValues() }),
    createContent: () => ({ bodyChild: "details content" })
  };
}

function findDetailsPanel(view: HTMLElement): HTMLElement | null {
  return view.querySelector<HTMLElement>(`.${LightboxDetailsPanelClass.root}`);
}

afterEach(() => {
  vi.restoreAllMocks();
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
    view.querySelector(`.${LightboxViewportClass.root}`)!
      .dispatchEvent(new PointerEvent("pointerdown", { button: 0, isPrimary: true, pointerId: 1, clientX: 10, clientY: 10 }));
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

  test.each<[LightboxMode, number]>([
    ["simple", 200],
    ["full", 250]
  ])("morphs back to the item's thumb over %s mode's %ims", async(mode, duration) => {
    const thumb = document.createElement("div");
    const isThumbHidden = (): boolean => thumb.style.getPropertyValue("visibility") === "hidden";

    document.body.append(thumb);
    vi.spyOn(HTMLCanvasElement.prototype, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 100, 100));
    const { view, retainedItems, scheduler } = setup(mode, () => thumb);

    retainedItems.value = [IMAGE];
    await flushMicrotasks();
    view.dispatchEvent(new Event("close"));
    scheduler.runFrame();
    scheduler.advance(duration - 1);
    scheduler.runFrame();
    const wasHiddenBeforeEnd = isThumbHidden();

    scheduler.advance(1);
    scheduler.runFrame();
    scheduler.runFrame();
    expect([wasHiddenBeforeEnd, isThumbHidden()]).toEqual([true, false]);
  });

  test("leaves out the details panel and its button without details", () => {
    const { view } = setup();

    expect([findDetailsPanel(view), view.querySelector("[aria-label=\"Details\"]")]).toEqual([null, null]);
  });

  test("mounts the details content and toggles the panel from the details button", () => {
    const lightboxDetails = createDetails();
    const { view } = setup("full", () => undefined, lightboxDetails);

    expect(findDetailsPanel(view)!.textContent).toContain("details content");
    view.querySelector<HTMLButtonElement>("[aria-label=\"Details\"]")!.click();
    expect(lightboxDetails.isOpen.value).toBe(true);
  });

  test("keeps the overlay awake while the pointer is over the details panel", () => {
    const { view, isOpen, scheduler } = setup("full", () => undefined, createDetails());

    isOpen.value = true;
    findDetailsPanel(view)!.dispatchEvent(new PointerEvent("pointerenter"));
    scheduler.advance(LONGER_THAN_ANY_INTERVAL);
    expect(view.hasAttribute("data-idle")).toBe(false);
    findDetailsPanel(view)!.dispatchEvent(new PointerEvent("pointerleave"));
    scheduler.advance(LONGER_THAN_ANY_INTERVAL);
    expect(view.hasAttribute("data-idle")).toBe(true);
  });

  test("takes focus back when focus moves into the video", () => {
    const { view, isOpen } = setup();
    const other = document.createElement("button");

    isOpen.value = true;
    document.body.append(other);
    other.focus();
    view.querySelector(`.${LightboxVideoClass.root}`)!.dispatchEvent(new FocusEvent("focusin"));
    expect(document.activeElement).toBe(view);
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
