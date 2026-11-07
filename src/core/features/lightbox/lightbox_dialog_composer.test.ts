import { Readable, Signal } from "@/core/utils/reactive/signal";
import { afterEach, describe, expect, test, vi } from "vitest";
import { KeyedStoredValue } from "@/core/utils/storage/keyed_stored_value";
import { Keymap } from "@/core/ui/hotkeys/keymap";
import { LIGHTBOX_ICON_PATHS } from "@/core/features/lightbox/overlay/lightbox_icon";
import { LightboxCommand } from "@/core/features/lightbox/commands/lightbox_command";
import { LightboxDetails } from "@/core/features/lightbox/details/lightbox_details";
import { LightboxDetailsPanelClass } from "@/core/features/lightbox/details/lightbox_details_panel";
import { LightboxFavorite } from "@/core/features/lightbox/favorite/lightbox_favorite";
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
import { composeLightboxDialog } from "@/core/features/lightbox/lightbox_dialog_composer";
import { createPost } from "@/testing/post";
import { flushMicrotasks } from "@/testing/microtask_utilities";
import { render } from "@/core/ui/h/h";

const IMAGE = createPost({ id: "1", media: { kind: "image", locator: "image.jpg" } });
const OTHER_IMAGE = createPost({ id: "2", media: { kind: "image", locator: "other.jpg" } });
const LONGER_THAN_ANY_INTERVAL = 60_000;

interface SetupOptions {
  locateItem?: (post: Post) => Element | undefined;
  lightboxDetails?: LightboxDetails<Post>;
  lightboxFavorite?: LightboxFavorite<Post>;
}

function setup(mode: LightboxMode = "full", { locateItem = (): undefined => undefined, lightboxDetails, lightboxFavorite }: SetupOptions = {}): {
  view: HTMLElement;
  isOpen: Signal<boolean>;
  currentItem: Signal<Post | undefined>;
  scheduler: MemoryScheduler;
  retainedItems: Signal<readonly Post[]>;
  goToNext: () => Promise<void>;
  download: () => void;
  close: () => void;
} {
  const isOpen = new Signal(false);
  const currentItem = new Signal<Post | undefined>(IMAGE);
  const scheduler = new MemoryScheduler();
  const retainedItems = new Signal<readonly Post[]>([]);
  const goToNext = vi.fn(() => Promise.resolve());
  const download = vi.fn();
  const close = vi.fn();
  const storage = { get: (): undefined => undefined, set: (): void => undefined };
  const remoteMedia = new MemoryRemoteMedia();
  const keymap: Keymap<LightboxCommand> = { ArrowRight: "showNext", " ": "toggleAutoplay", d: "download", f: "toggleFullscreen", e: "addFavorite" };
  const { result: view } = render(document, () => composeLightboxDialog<Post>({ keymap }, {
    scheduler,
    sizeObserver: new MemorySizeObserver(),
    viewport: new MemoryViewport(),
    remoteMedia,
    lightboxMediaResolver: new LightboxMediaResolver(media => remoteMedia.resolveMedia(media)),
    lightboxActions: { openPostPage: vi.fn(), openOriginal: vi.fn(), download },
    lightboxNavigation: {
      isOpen,
      currentItem,
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
    lightboxDetails,
    lightboxFavorite
  }));

  document.body.append(view);
  return { view, isOpen, currentItem, scheduler, retainedItems, goToNext, download, close };
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

function createFavorite(favoritedPostIds: Readable<readonly string[]>): LightboxFavorite<Post> {
  return { isFavorited: ({ id }) => favoritedPostIds.value.includes(id), add: vi.fn() };
}

function findFavoriteButton(view: HTMLElement): HTMLButtonElement | null {
  return view.querySelector<HTMLButtonElement>("[aria-label=\"Add to Favorites\"], [aria-label=\"Favorited\"]");
}

function readFavoriteIconPath(view: HTMLElement): string | null | undefined {
  return findFavoriteButton(view)?.querySelector("path")?.getAttribute("d");
}

afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(document, "fullscreenElement");
  Reflect.deleteProperty(document, "exitFullscreen");
  Reflect.deleteProperty(HTMLElement.prototype, "requestFullscreen");
  document.body.replaceChildren();
});

describe("composeLightboxDialog", () => {
  test("runs the command its keymap gives a key", () => {
    const { view, goToNext } = setup();

    pressKey(view, "ArrowRight");
    expect(goToNext).toHaveBeenCalledOnce();
  });

  test("steps from its arrows", () => {
    const { view, goToNext } = setup();

    view.querySelector<HTMLButtonElement>("[aria-label=\"Next\"]")!.click();
    expect(goToNext).toHaveBeenCalledOnce();
  });

  test("keeps the overlay awake while the pointer is over the chrome", () => {
    const { view, isOpen, scheduler } = setup();
    const slot = view.querySelector<HTMLButtonElement>("[aria-label=\"Next\"]")!.parentElement!;

    isOpen.value = true;
    slot.dispatchEvent(new PointerEvent("pointerenter"));
    scheduler.advance(LONGER_THAN_ANY_INTERVAL);
    expect(view.hasAttribute("data-idle")).toBe(false);
    slot.dispatchEvent(new PointerEvent("pointerleave"));
    scheduler.advance(LONGER_THAN_ANY_INTERVAL);
    expect(view.hasAttribute("data-idle")).toBe(true);
  });

  test("ignores commands beyond stepping, playback, fullscreen, closing and opening in simple mode", () => {
    const { view, goToNext, download } = setup("simple");

    pressKey(view, "d");
    pressKey(view, "ArrowRight");
    expect(download).not.toHaveBeenCalled();
    expect(goToNext).toHaveBeenCalledOnce();
  });

  test("takes fullscreen from its key in simple mode", () => {
    const requestFullscreen = vi.fn(() => Promise.resolve());
    const { view } = setup("simple");

    Object.defineProperty(HTMLElement.prototype, "requestFullscreen", { value: requestFullscreen, configurable: true });
    pressKey(view, "f");
    expect(requestFullscreen).toHaveBeenCalledOnce();
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
    const { view, retainedItems, scheduler } = setup(mode, { locateItem: () => thumb });

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
    const { view } = setup("full", { lightboxDetails });

    expect(findDetailsPanel(view)!.textContent).toContain("details content");
    view.querySelector<HTMLButtonElement>("[aria-label=\"Details\"]")!.click();
    expect(lightboxDetails.isOpen.value).toBe(true);
  });

  test("keeps the overlay awake while the pointer is over the details panel", () => {
    const { view, isOpen, scheduler } = setup("full", { lightboxDetails: createDetails() });

    isOpen.value = true;
    findDetailsPanel(view)!.dispatchEvent(new PointerEvent("pointerenter"));
    scheduler.advance(LONGER_THAN_ANY_INTERVAL);
    expect(view.hasAttribute("data-idle")).toBe(false);
    findDetailsPanel(view)!.dispatchEvent(new PointerEvent("pointerleave"));
    scheduler.advance(LONGER_THAN_ANY_INTERVAL);
    expect(view.hasAttribute("data-idle")).toBe(true);
  });

  test("leaves out the favorite button without a favorite action", () => {
    expect(findFavoriteButton(setup().view)).toBeNull();
  });

  test("offers to add a post that isn't a favorite", () => {
    const { view } = setup("full", { lightboxFavorite: createFavorite(new Signal([])) });

    expect(readFavoriteIconPath(view)).toBe(LIGHTBOX_ICON_PATHS.heartPlus);
    expect(findFavoriteButton(view)!.title).toBe("Add to Favorites (E)");
  });

  test("shows a favorite as favorited", () => {
    const { view } = setup("full", { lightboxFavorite: createFavorite(new Signal([IMAGE.id])) });

    expect(readFavoriteIconPath(view)).toBe(LIGHTBOX_ICON_PATHS.heartFilled);
    expect(findFavoriteButton(view)!.title).toBe("Favorited (E)");
  });

  test("offers to add when no item is current", () => {
    const { view, currentItem } = setup("full", { lightboxFavorite: createFavorite(new Signal([IMAGE.id])) });

    currentItem.value = undefined;
    expect(readFavoriteIconPath(view)).toBe(LIGHTBOX_ICON_PATHS.heartPlus);
  });

  test("follows the current item on the favorite button", () => {
    const { view, currentItem } = setup("full", { lightboxFavorite: createFavorite(new Signal([OTHER_IMAGE.id])) });

    currentItem.value = OTHER_IMAGE;
    expect(readFavoriteIconPath(view)).toBe(LIGHTBOX_ICON_PATHS.heartFilled);
  });

  test("fills the favorite button as soon as the current item becomes a favorite", () => {
    const favoritedPostIds = new Signal<readonly string[]>([]);
    const { view } = setup("full", { lightboxFavorite: createFavorite(favoritedPostIds) });

    favoritedPostIds.value = [IMAGE.id];
    expect(readFavoriteIconPath(view)).toBe(LIGHTBOX_ICON_PATHS.heartFilled);
  });

  test.each<LightboxMode>(["full", "simple"])("adds the current item from the favorite button in %s mode", mode => {
    const lightboxFavorite = createFavorite(new Signal([]));
    const { view } = setup(mode, { lightboxFavorite });

    findFavoriteButton(view)!.click();
    expect(lightboxFavorite.add).toHaveBeenCalledWith(IMAGE);
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

  test("takes fullscreen with an element inside the dialog that holds its controls", () => {
    const requestFullscreen = vi.fn(() => Promise.resolve());
    const { view, isOpen } = setup();

    Object.defineProperty(HTMLElement.prototype, "requestFullscreen", { value: requestFullscreen, configurable: true });
    isOpen.value = true;
    const button = view.querySelector<HTMLButtonElement>("[aria-label=\"Fullscreen\"]")!;

    button.click();
    const target = requestFullscreen.mock.contexts[0] as HTMLElement;

    expect([target === view, view.contains(target), target.contains(button)]).toEqual([false, true, true]);
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
