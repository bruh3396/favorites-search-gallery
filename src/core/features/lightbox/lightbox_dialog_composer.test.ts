import { Icon, createIcon } from "@/core/ui/components/icon/icon";
import { Readable, Signal } from "@/core/utils/reactive/signal";
import { afterEach, describe, expect, test, vi } from "vitest";
import { KeyBindings } from "@/core/ui/key_bindings/key_bindings";
import { KeyedStoredValue } from "@/core/utils/storage/keyed_stored_value";
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
  lightboxKeyBindings: Signal<KeyBindings<LightboxCommand>>;
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
  const lightboxKeyBindings = new Signal<KeyBindings<LightboxCommand>>({
    showNext: ["ArrowRight"],
    showPrevious: [],
    toggleAutoplay: [" "],
    togglePause: [],
    toggleMute: [],
    toggleFullscreen: ["f"],
    toggleZoom: [],
    toggleDetails: [],
    dismiss: [],
    download: ["d"],
    openPostPage: [],
    openOriginal: [],
    close: [],
    addFavorite: ["e"]
  });
  const { result: view } = render(document, () => composeLightboxDialog<Post>({
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
    lightboxKeyBindings,
    locateItem,
    lightboxDetails,
    lightboxFavorite
  }));

  document.body.append(view);
  return { view, isOpen, currentItem, scheduler, retainedItems, lightboxKeyBindings, goToNext, download, close };
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

function findButton(view: HTMLElement, label: string): HTMLButtonElement | null {
  return view.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`);
}

function readIconPath(button: HTMLElement): string | null | undefined {
  return button.querySelector("path")?.getAttribute("d");
}

function readFavoriteIconPath(view: HTMLElement): string | null | undefined {
  return readIconPath(findFavoriteButton(view)!);
}

function drawnIconPath(icon: Icon): string | null {
  return render(document, () => createIcon(icon, "")).result.querySelector("path")!.getAttribute("d");
}

afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(document, "fullscreenElement");
  Reflect.deleteProperty(document, "exitFullscreen");
  Reflect.deleteProperty(HTMLElement.prototype, "requestFullscreen");
  document.body.replaceChildren();
});

describe("composeLightboxDialog", () => {
  test("runs the command bound to a key", () => {
    const { view, goToNext } = setup();

    pressKey(view, "ArrowRight");
    expect(goToNext).toHaveBeenCalledOnce();
  });

  test("follows changed key bindings", () => {
    const { view, lightboxKeyBindings, goToNext } = setup();

    lightboxKeyBindings.value = { ...lightboxKeyBindings.peek(), showNext: ["n"] };
    pressKey(view, "ArrowRight");
    pressKey(view, "n");
    expect(goToNext).toHaveBeenCalledOnce();
  });

  test("titles a command button with its first key, following changed key bindings", () => {
    const { view, lightboxKeyBindings } = setup();
    const button = findButton(view, "Fullscreen")!;
    const title = button.title;

    lightboxKeyBindings.value = { ...lightboxKeyBindings.peek(), toggleFullscreen: [] };
    expect([title, button.title]).toEqual(["Fullscreen (F)", "Fullscreen"]);
  });

  test("labels a command button with its command's label by default", () => {
    const { view, close } = setup();

    findButton(view, "Close")!.click();
    expect(close).toHaveBeenCalledOnce();
  });

  test("titles its arrows with their keys", () => {
    expect(findButton(setup().view, "Go to Next")!.title).toBe("Go to Next (→)");
  });

  test("shows autoplay as a pressed pause button while autoplaying", () => {
    const { view } = setup();
    const button = findButton(view, "Autoplay")!;

    pressKey(view, " ");
    const playing = [button.getAttribute("aria-pressed"), button.title, readIconPath(button)];

    button.click();
    const stopped = [button.getAttribute("aria-pressed"), readIconPath(button)];

    expect([playing, stopped]).toEqual([["true", "Autoplay (Space)", drawnIconPath("pause")], ["false", drawnIconPath("play")]]);
  });

  test("shows fullscreen as a pressed exit button while in fullscreen", () => {
    const { view } = setup();
    const button = findButton(view, "Fullscreen")!;

    Object.defineProperty(document, "fullscreenElement", { value: document.documentElement, configurable: true });
    document.dispatchEvent(new Event("fullscreenchange"));
    expect([button.getAttribute("aria-pressed"), readIconPath(button)]).toEqual(["true", drawnIconPath("exitFullscreen")]);
  });

  test("holds the overlay and autoplay while the more menu is open", async() => {
    const { view, isOpen, scheduler, retainedItems, goToNext } = setup();

    retainedItems.value = [IMAGE];
    await flushMicrotasks();
    isOpen.value = true;
    pressKey(view, " ");
    findButton(view, "More")!.click();
    scheduler.advance(LONGER_THAN_ANY_INTERVAL);
    const whileOpen = [view.hasAttribute("data-idle"), vi.mocked(goToNext).mock.calls.length];

    document.querySelector<HTMLElement>("[role=menu]")!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    scheduler.advance(LONGER_THAN_ANY_INTERVAL);
    expect([whileOpen, [view.hasAttribute("data-idle"), vi.mocked(goToNext).mock.calls.length]]).toEqual([[false, 0], [true, 1]]);
  });

  test("keeps the post page action out of the toolbar", () => {
    expect(findButton(setup().view, "Post Page")).toBeNull();
  });

  test("steps from its arrows", () => {
    const { view, goToNext } = setup();

    view.querySelector<HTMLButtonElement>("[aria-label=\"Go to Next\"]")!.click();
    expect(goToNext).toHaveBeenCalledOnce();
  });

  test("keeps the overlay awake while the pointer is over the chrome", () => {
    const { view, isOpen, scheduler } = setup();
    const slot = view.querySelector<HTMLButtonElement>("[aria-label=\"Go to Next\"]")!.parentElement!;

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

  test("closes immediately without morphing in simple mode with loaded media", async() => {
    const locateItem = vi.fn(() => document.createElement("div"));
    const { view, retainedItems, close } = setup("simple", { locateItem });

    retainedItems.value = [IMAGE];
    await flushMicrotasks();
    view.dispatchEvent(new Event("close"));
    expect(close).toHaveBeenCalledOnce();
    expect(locateItem).not.toHaveBeenCalled();
  });

  test("morphs back to the item's thumb over full mode's 250ms", async() => {
    const duration = 250;
    const thumb = document.createElement("div");
    const isThumbHidden = (): boolean => thumb.style.getPropertyValue("visibility") === "hidden";

    document.body.append(thumb);
    vi.spyOn(HTMLCanvasElement.prototype, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 100, 100));
    const { view, retainedItems, scheduler } = setup("full", { locateItem: () => thumb });

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

    expect([findDetailsPanel(view), findButton(view, "Details")]).toEqual([null, null]);
  });

  test("mounts the details content and toggles the panel from the details button", () => {
    const lightboxDetails = createDetails();
    const { view } = setup("full", { lightboxDetails });

    expect(findDetailsPanel(view)!.textContent).toContain("details content");
    findButton(view, "Details")!.click();
    expect(lightboxDetails.isOpen.value).toBe(true);
  });

  test("shows details as pressed while open, and hides them from the panel", () => {
    const lightboxDetails = createDetails();
    const { view } = setup("full", { lightboxDetails });
    const detailsButton = findButton(view, "Details")!;

    lightboxDetails.isOpen.set(true);
    const pressedWhileOpen = detailsButton.getAttribute("aria-pressed");

    findButton(view, "Hide Details")!.click();
    expect([pressedWhileOpen, lightboxDetails.isOpen.value, detailsButton.getAttribute("aria-pressed")]).toEqual(["true", false, "false"]);
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

    expect(readFavoriteIconPath(view)).toBe(drawnIconPath("heartPlus"));
    expect(findFavoriteButton(view)!.title).toBe("Add to Favorites (E)");
  });

  test("shows a favorite as favorited", () => {
    const { view } = setup("full", { lightboxFavorite: createFavorite(new Signal([IMAGE.id])) });

    expect(readFavoriteIconPath(view)).toBe(drawnIconPath("heartFilled"));
    expect(findFavoriteButton(view)!.title).toBe("Favorited (E)");
  });

  test("offers to add when no item is current", () => {
    const { view, currentItem } = setup("full", { lightboxFavorite: createFavorite(new Signal([IMAGE.id])) });

    currentItem.value = undefined;
    expect(readFavoriteIconPath(view)).toBe(drawnIconPath("heartPlus"));
  });

  test("follows the current item on the favorite button", () => {
    const { view, currentItem } = setup("full", { lightboxFavorite: createFavorite(new Signal([OTHER_IMAGE.id])) });

    currentItem.value = OTHER_IMAGE;
    expect(readFavoriteIconPath(view)).toBe(drawnIconPath("heartFilled"));
  });

  test("fills the favorite button as soon as the current item becomes a favorite", () => {
    const favoritedPostIds = new Signal<readonly string[]>([]);
    const { view } = setup("full", { lightboxFavorite: createFavorite(favoritedPostIds) });

    favoritedPostIds.value = [IMAGE.id];
    expect(readFavoriteIconPath(view)).toBe(drawnIconPath("heartFilled"));
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
    const button = findButton(view, "Fullscreen")!;

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
