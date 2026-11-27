import { LIGHTBOX_COMMAND_DEFINITIONS, LightboxCommand } from "@/core/features/lightbox/commands/lightbox_command";
import { LightboxOverlayDependencies, composeLightboxOverlay } from "@/core/features/lightbox/overlay/lightbox_overlay_composer";
import { afterEach, describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { KeyedStoredValue } from "@/core/utils/storage/keyed_stored_value";
import { LightboxButton } from "@/core/features/lightbox/overlay/lightbox_button";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/memory_local_keyed_values";
import { Post } from "@/core/domain/post/post";
import { Signal } from "@/core/utils/reactive/signal";
import { createKeyBindings } from "@/testing/key_bindings";
import { createPost } from "@/testing/post";

const LIGHTBOX_COMMANDS = Object.keys(LIGHTBOX_COMMAND_DEFINITIONS) as LightboxCommand[];
const POST = createPost({ id: "1" });
const OTHER_POST = createPost({ id: "2" });

type SetupOptions = Partial<Pick<LightboxOverlayDependencies<Post>, "lightboxDetails" | "lightboxFavorite">>;

function setup({ lightboxDetails, lightboxFavorite }: SetupOptions = {}): {
  lightboxOverlay: HTMLElement;
  currentItem: Signal<Post | undefined>;
  video: Signal<HTMLVideoElement | undefined>;
  isPlaying: Signal<boolean>;
  inFullscreen: Signal<boolean>;
  lightboxOverlayVisibility: LightboxOverlayDependencies<Post>["visibility"];
  handlers: LightboxOverlayDependencies<Post>["handlers"];
  onMoreMenuOpenChange: (isOpen: boolean) => void;
} {
  const currentItem = new Signal<Post | undefined>(POST);
  const video = new Signal<HTMLVideoElement | undefined>(undefined);
  const isPlaying = new Signal(false);
  const inFullscreen = new Signal(false);
  const lightboxOverlayVisibility = { hold: vi.fn(), release: vi.fn() };
  const handlers = {
    openPostPage: vi.fn(), download: vi.fn(), openOriginal: vi.fn(), toggleZoom: vi.fn(), toggleMute: vi.fn(), showPrevious: vi.fn(), showNext: vi.fn()
  };
  const onMoreMenuOpenChange = vi.fn();
  const { result: lightboxOverlay } = render(document, () => composeLightboxOverlay<Post>({
    visibility: lightboxOverlayVisibility,
    lightboxNavigation: { currentItem, position: new Signal(undefined) },
    lightboxStage: { video },
    lightboxZoom: { isZoomed: new Signal(false), canZoom: new Signal(false) },
    lightboxAutoplay: { countdown: new Signal(undefined), isPlaying },
    lightboxFullscreen: { inFullscreen },
    muted: new Signal(false),
    lightboxKeyBindings: new Signal(createKeyBindings(LIGHTBOX_COMMANDS, { showNext: ["ArrowRight"] })),
    handlers,
    createLightboxCommandButton: (lightboxCommand, { icon, pressed, label = lightboxCommand }) => h(LightboxButton, { icon, pressed, label }),
    onMoreMenuOpenChange,
    lightboxDetails,
    lightboxFavorite
  }));

  document.body.append(lightboxOverlay);
  return { lightboxOverlay, currentItem, video, isPlaying, inFullscreen, lightboxOverlayVisibility, handlers, onMoreMenuOpenChange };
}

function findButton(label: string): HTMLButtonElement | null {
  return document.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`);
}

function listMenuItemLabels(): Array<string | null> {
  return [...document.querySelectorAll("[role^=menuitem]")].map(item => item.textContent);
}

function crossPointer(element: Element, type: "pointerenter" | "pointerleave"): void {
  for (let crossedElement: Element | null = element; crossedElement !== null; crossedElement = crossedElement.parentElement) {
    crossedElement.dispatchEvent(new PointerEvent(type));
  }
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("composeLightboxOverlay", () => {
  test("leaves out the favorite and details buttons without their features", () => {
    setup();
    expect([findButton("Add to Favorites"), findButton("Favorited"), findButton("Details")]).toEqual([null, null, null]);
  });

  test("labels the favorite button by whether the current item is a favorite", () => {
    const { currentItem } = setup({ lightboxFavorite: { isFavorited: ({ id }) => id === POST.id } });
    const wasFavoritedWhenFavorited = findButton("Favorited") !== null;

    currentItem.value = OTHER_POST;
    const wasOfferedWhenNotFavorited = findButton("Add to Favorites") !== null;

    currentItem.value = undefined;
    expect([wasFavoritedWhenFavorited, wasOfferedWhenNotFavorited, findButton("Add to Favorites") !== null]).toEqual([true, true, true]);
  });

  test("presses the details button while details are open", () => {
    const isOpen = new KeyedStoredValue({ key: "detailsOpen", defaultValue: false }, { storedValueStorage: new MemoryLocalKeyedValues() });

    setup({ lightboxDetails: { isOpen } });
    const closed = findButton("Details")!.getAttribute("aria-pressed");

    isOpen.set(true);
    expect([closed, findButton("Details")!.getAttribute("aria-pressed")]).toEqual(["false", "true"]);
  });

  test("presses autoplay and fullscreen while they are on", () => {
    const { isPlaying, inFullscreen } = setup();

    isPlaying.value = true;
    inFullscreen.value = true;
    expect([findButton("Autoplay")!.getAttribute("aria-pressed"), findButton("Fullscreen")!.getAttribute("aria-pressed")]).toEqual(["true", "true"]);
  });

  test("holds the overlay while the more menu is open, and reports it", () => {
    const { lightboxOverlayVisibility, onMoreMenuOpenChange } = setup();

    findButton("More")!.click();
    const heldWhileOpen = vi.mocked(lightboxOverlayVisibility.hold).mock.calls.length;

    findButton("More")!.click();
    expect([heldWhileOpen, vi.mocked(lightboxOverlayVisibility.release).mock.calls.length]).toEqual([1, 1]);
    expect(vi.mocked(onMoreMenuOpenChange).mock.calls).toEqual([[true], [false]]);
  });

  test("offers mute in the more menu only while a video is shown", () => {
    const { video } = setup();

    findButton("More")!.click();
    const wasMuteOfferedWithoutVideo = listMenuItemLabels().includes("Mute");

    findButton("More")!.click();
    video.value = document.createElement("video");
    findButton("More")!.click();
    expect([wasMuteOfferedWithoutVideo, listMenuItemLabels().includes("Mute")]).toEqual([false, true]);
  });

  test("steps from its arrows, titled with their keys", () => {
    const { handlers } = setup();
    const next = findButton(LIGHTBOX_COMMAND_DEFINITIONS.showNext.label)!;

    next.click();
    findButton(LIGHTBOX_COMMAND_DEFINITIONS.showPrevious.label)!.click();
    expect(next.title).toBe(`${LIGHTBOX_COMMAND_DEFINITIONS.showNext.label} (→)`);
    expect([vi.mocked(handlers.showNext).mock.calls.length, vi.mocked(handlers.showPrevious).mock.calls.length]).toEqual([1, 1]);
  });

  test("holds the overlay while the pointer is over its controls", () => {
    const { lightboxOverlayVisibility } = setup();
    const more = findButton("More")!;

    crossPointer(more, "pointerenter");
    crossPointer(more, "pointerleave");
    expect([vi.mocked(lightboxOverlayVisibility.hold).mock.calls.length, vi.mocked(lightboxOverlayVisibility.release).mock.calls.length]).toEqual([1, 1]);
  });
});
