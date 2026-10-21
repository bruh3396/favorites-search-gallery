import { LightboxScreen, LightboxScreenClass } from "@/core/features/lightbox/ui/screen/screen";
import { MediaSequence, SequencePosition } from "@/core/domain/media/media_sequence";
import { Mock, describe, expect, onTestFinished, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { LightboxAutoplay } from "@/core/features/lightbox/autoplay/autoplay";
import { LightboxButtonClass } from "@/core/features/lightbox/ui/controls/button/button";
import { LightboxMinimapClass } from "@/core/features/lightbox/ui/minimap/minimap";
import { LightboxNavigation } from "@/core/features/lightbox/navigation/navigation";
import { LightboxOverlayClass } from "@/core/features/lightbox/ui/overlay/overlay";
import { LightboxPositionClass } from "@/core/features/lightbox/ui/controls/position/position";
import { LightboxStageClass } from "@/core/features/lightbox/ui/stage/stage";
import { LightboxStageRendererClass } from "@/core/features/lightbox/ui/stage/renderer";
import { LightboxZoom } from "@/core/features/lightbox/zoom/zoom";
import { LightboxZoomChipClass } from "@/core/features/lightbox/ui/zoom_chip/zoom_chip";
import { Media } from "@/core/domain/media/media";
import { MediaItem } from "@/core/domain/post/post";
import { MemoryMorpher } from "@/adapters/memory/ports/morpher/morpher";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { MemorySizeObserver } from "@/adapters/memory/ports/size_observer/size_observer";
import SCREEN_CSS from "@/core/features/lightbox/ui/screen/screen.css?inline";
import { doNothing } from "@/core/utils/function/function";
import { expectClassesStyled } from "@/testing/css";

const POST: MediaItem = { id: "1", media: { kind: "image", locator: "images/1" } };
const VIDEO: MediaItem = { id: "2", media: { kind: "video", locator: "videos/2.mp4" } };
const SIZE_OBSERVER = new MemorySizeObserver();

interface Setup {
  dialog: HTMLDialogElement;
  navigation: LightboxNavigation<MediaItem>;
  scheduler: MemoryScheduler;
  decodeOriginal: Mock<(media: Media, signal?: AbortSignal) => Promise<ImageBitmap>>;
  onShowNext: Mock<() => Promise<void>>;
  onClose: Mock<() => void>;
  download: Mock<(item: MediaItem) => void>;
  openPostPage: Mock<(item: MediaItem) => void>;
  addFavorite: Mock<(item: MediaItem) => void>;
  morpher: MemoryMorpher;
  place: HTMLElement;
  dispose: () => void;
}

function sequence(position: SequencePosition | undefined = { index: 0, total: 1 }): MediaSequence<MediaItem> {
  return {
    getNext: () => Promise.resolve(undefined),
    getPrevious: () => Promise.resolve(undefined),
    positionOf: () => position
  };
}

function setup(): Setup {
  const scheduler = new MemoryScheduler();
  const navigation = new LightboxNavigation<MediaItem>({ maxWarmItems: 2, maxNeighborDistance: 2, settleDelay: 75 }, scheduler);
  const onShowNext = vi.spyOn(navigation, "showNext").mockResolvedValue();
  const onClose = vi.spyOn(navigation, "close");
  const autoplay = new LightboxAutoplay({ interval: 3_000 }, { current: navigation.current, showNext: () => navigation.showNext(), scheduler });
  const zoom = new LightboxZoom({ minimumScale: 2 }, { current: navigation.current });
  const decodeOriginal = vi.fn<(media: Media, signal?: AbortSignal) => Promise<ImageBitmap>>(() => new Promise(doNothing));
  const morpher = new MemoryMorpher();
  const place = document.createElement("div");
  const download = vi.fn<(item: MediaItem) => void>();
  const openPostPage = vi.fn<(item: MediaItem) => void>();
  const addFavorite = vi.fn<(item: MediaItem) => void>();
  const { result, dispose } = render(document, () => (
    <LightboxScreen
      navigation={navigation}
      autoplay={autoplay}
      zoom={zoom}
      actions={{ openOriginal: doNothing, openPostPage, download }}
      remoteMedia={{
        resolvePreviewUrl: media => Promise.resolve(`https://preview/${media.locator}`),
        resolveOriginalUrl: media => Promise.resolve(`https://original/${media.locator}`),
        decodeOriginal
      }}
      overlay={{ idleDelay: 1_000, hideSoonDelay: 1_000 }}
      scheduler={scheduler}
      sizeObserver={SIZE_OBSERVER}
      morpher={morpher}
      locateItem={() => place}
      favorites={{ isFavorited: () => false, addFavorite, removeFavorite: doNothing }}
    />
  ));

  document.body.append(result);
  onTestFinished(() => {
    dispose();
    autoplay.dispose();
    zoom.dispose();
    result.remove();
  });
  return {
    dialog: result as HTMLDialogElement, navigation, scheduler, decodeOriginal, onShowNext, onClose,
    download, openPostPage, addFavorite, morpher, place, dispose
  };
}

function findButton(dialog: HTMLDialogElement, icon: string): HTMLElement {
  return dialog.querySelector<HTMLElement>(`.${LightboxButtonClass.root}[data-icon="${icon}"]`)!;
}

function findOverlay(dialog: HTMLDialogElement): HTMLElement {
  return dialog.querySelector<HTMLElement>(`.${LightboxOverlayClass.root}`)!;
}

function pressKey(target: Element, key: string): void {
  target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
}

function cancel(dialog: HTMLDialogElement): Event {
  const event = new Event("cancel", { cancelable: true });

  dialog.dispatchEvent(event);
  return event;
}

function layOutLargeImage(dialog: HTMLDialogElement): HTMLElement {
  const stageRoot = dialog.querySelector<HTMLElement>(`.${LightboxStageClass.root}`)!;
  const preview = dialog.querySelector<HTMLImageElement>(`img.${LightboxStageRendererClass.media}`)!;

  SIZE_OBSERVER.resize(stageRoot, { width: 1_000, height: 500 });
  Object.defineProperties(preview, { naturalWidth: { value: 4_000 }, naturalHeight: { value: 2_000 } });
  preview.dispatchEvent(new Event("load"));
  return stageRoot;
}

describe("LightboxScreen", () => {
  test("draws a labelled dialog that stays closed until a post is open", () => {
    const { dialog } = setup();

    expect([dialog.tagName, dialog.getAttribute("aria-label"), dialog.open]).toEqual(["DIALOG", "Gallery", false]);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(LightboxScreenClass, SCREEN_CSS);
  });

  test("loads the open post's original on its stage", async() => {
    const { navigation, scheduler, decodeOriginal } = setup();

    navigation.open(POST, sequence());
    scheduler.advance(200);
    await vi.waitFor(() => expect(decodeOriginal).toHaveBeenCalledWith(POST.media, expect.any(AbortSignal)));
  });

  test("opens while a post is open and closes once none is", () => {
    const { dialog, navigation } = setup();
    const states = [dialog.open];

    navigation.open(POST, sequence());
    states.push(dialog.open);
    navigation.close();
    states.push(dialog.open);
    expect(states).toEqual([false, true, false]);
  });

  test("stays open without reopening when the shown post changes", () => {
    const { dialog, navigation } = setup();
    const showModal = vi.spyOn(dialog, "showModal");

    navigation.open(POST, sequence());
    navigation.open(VIDEO, sequence());
    expect([dialog.open, showModal.mock.calls.length]).toEqual([true, 1]);
  });

  test("shows its overlay on open and hides it and the cursor once idle", () => {
    const { dialog, navigation, scheduler } = setup();
    const states: (string | undefined)[][] = [];

    navigation.open(POST, sequence());
    states.push([findOverlay(dialog).dataset.shown, dialog.dataset.idle]);
    scheduler.advance(2_000);
    states.push([findOverlay(dialog).dataset.shown, dialog.dataset.idle]);
    expect(states).toEqual([["true", "false"], ["false", "true"]]);
  });

  test("hides its overlay on close", () => {
    const { dialog, navigation } = setup();

    navigation.open(POST, sequence());
    navigation.close();
    expect(findOverlay(dialog).dataset.shown).toBe("false");
  });

  test("hears keys while focus has slipped out of it, and only while it is open", () => {
    const { navigation, onShowNext } = setup();

    pressKey(document.body, "ArrowRight");
    navigation.open(POST, sequence());
    pressKey(document.body, "ArrowRight");
    navigation.close();
    pressKey(document.body, "ArrowRight");
    expect(onShowNext).toHaveBeenCalledOnce();
  });

  test("closes its dialog and stops hearing keys once disposed", () => {
    const { dialog, navigation, onShowNext, dispose } = setup();

    navigation.open(POST, sequence());
    dispose();
    pressKey(document.body, "ArrowRight");
    expect([dialog.open, onShowNext.mock.calls.length]).toEqual([false, 0]);
  });

  test("zooms from its button and from a Shift click, and zooms out on a plain click", () => {
    const { dialog, navigation, onClose } = setup();
    const zoomedStates: (string | undefined)[] = [];

    navigation.open(POST, sequence());
    layOutLargeImage(dialog);
    findButton(dialog, "zoomIn").click();
    zoomedStates.push(dialog.dataset.zoomed);
    dialog.click();
    zoomedStates.push(dialog.dataset.zoomed);
    dialog.dispatchEvent(new MouseEvent("click", { shiftKey: true, clientX: 100, clientY: 100, bubbles: true }));
    zoomedStates.push(dialog.dataset.zoomed);
    expect([zoomedStates, onClose.mock.calls.length]).toEqual([["true", "false", "true"], 0]);
  });

  test("pans the zoomed image on its stage by dragging it", () => {
    const { dialog, navigation } = setup();

    navigation.open(POST, sequence());
    const stageRoot = layOutLargeImage(dialog);

    findButton(dialog, "zoomIn").click();
    dialog.dispatchEvent(new PointerEvent("pointerdown", { button: 0, clientX: 500, clientY: 250, bubbles: true }));
    dialog.dispatchEvent(new PointerEvent("pointermove", { pointerType: "mouse", clientX: 520, clientY: 260, bubbles: true }));
    dialog.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
    expect(stageRoot.style.transform).toBe("translate(-1480px, -740px) scale(4)");
  });

  test("shows its overlay again when the mouse moves", () => {
    const { dialog, navigation, scheduler } = setup();

    navigation.open(POST, sequence());
    scheduler.advance(2_000);
    dialog.dispatchEvent(new PointerEvent("pointermove", { pointerType: "mouse", screenX: 10, bubbles: true }));
    expect(findOverlay(dialog).dataset.shown).toBe("true");
  });

  test("morphs the shown image into the item's place as a click closes it", () => {
    const { dialog, navigation, morpher, place } = setup();

    navigation.open(POST, sequence());
    dialog.click();
    expect([morpher.morphs, dialog.open]).toEqual([[{ source: expect.any(HTMLImageElement), target: place }], false]);
  });

  test("stays open when a control in its overlay is clicked", () => {
    const { dialog, navigation, onClose } = setup();

    navigation.open(POST, sequence());
    (findOverlay(dialog).querySelector(`.${LightboxPositionClass.root}`) as HTMLElement).click();
    expect(onClose).not.toHaveBeenCalled();
  });

  test("shows a zoom-in cursor while Shift is held and a zoom-out cursor once zoomed", () => {
    const { dialog, navigation } = setup();
    const cursors: (string | undefined)[] = [];

    navigation.open(POST, sequence());
    layOutLargeImage(dialog);
    cursors.push(dialog.dataset.zoomCursor);
    dialog.dispatchEvent(new KeyboardEvent("keydown", { key: "Shift", shiftKey: true, bubbles: true }));
    cursors.push(dialog.dataset.zoomCursor);
    dialog.dispatchEvent(new MouseEvent("click", { shiftKey: true, clientX: 100, clientY: 100, bubbles: true }));
    cursors.push(dialog.dataset.zoomCursor);
    dialog.dispatchEvent(new KeyboardEvent("keyup", { key: "Shift", bubbles: true }));
    cursors.push(dialog.dataset.zoomCursor);
    expect(cursors).toEqual(["none", "in", "out", "none"]);
  });

  test("shows no zoom cursor on a video while Shift is held", () => {
    const { dialog, navigation } = setup();

    navigation.open(VIDEO, sequence());
    dialog.dispatchEvent(new KeyboardEvent("keydown", { key: "Shift", shiftKey: true, bubbles: true }));
    expect(dialog.dataset.zoomCursor).toBe("none");
  });

  test("shows the zoom chip and minimap only while zoomed", () => {
    const { dialog, navigation } = setup();
    const findHidden = (): boolean[] => [LightboxZoomChipClass.root, LightboxMinimapClass.root]
      .map(className => dialog.querySelector<HTMLElement>(`.${className}`)!.hidden);
    const states = [findHidden()];

    navigation.open(POST, sequence());
    layOutLargeImage(dialog);
    findButton(dialog, "zoomIn").click();
    states.push(findHidden());
    dialog.click();
    states.push(findHidden());
    expect(states).toEqual([[true, true], [false, false], [true, true]]);
  });

  test("morphs on Escape instead of letting the browser close it", () => {
    const { navigation, dialog, morpher } = setup();

    navigation.open(POST, sequence());
    expect([cancel(dialog).defaultPrevented, morpher.morphs.length]).toEqual([true, 1]);
  });

  test("zooms out on Escape while zoomed, and closes on the next one", () => {
    const { dialog, navigation, morpher } = setup();
    const states: [string | undefined, number][] = [];

    navigation.open(POST, sequence());
    layOutLargeImage(dialog);
    pressKey(dialog, "z");
    cancel(dialog);
    states.push([dialog.dataset.zoomed, morpher.morphs.length]);
    cancel(dialog);
    states.push([dialog.dataset.zoomed, morpher.morphs.length]);
    expect(states).toEqual([["false", 0], ["false", 1]]);
  });

  test("reports a close without a morph when the browser dismisses it", async() => {
    const { dialog, navigation, onClose, morpher } = setup();

    navigation.open(POST, sequence());
    dialog.close();
    await vi.waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(morpher.morphs).toEqual([]);
  });

  test("doesn't report a close it was told to make", async() => {
    const { navigation, onClose } = setup();

    navigation.open(POST, sequence());
    navigation.close();
    await new Promise(resolve => setTimeout(resolve));
    expect(onClose).toHaveBeenCalledOnce();
  });

  test("morphs into the item's place when its close button is clicked", () => {
    const { dialog, navigation, morpher, place } = setup();

    navigation.open(POST, sequence());
    findButton(dialog, "close").click();
    expect([morpher.morphs.map(morph => morph.target), dialog.open]).toEqual([[place], false]);
  });

  test("reports the shown post to its favorite, download, and post page buttons without closing", () => {
    const { dialog, navigation, addFavorite, download, openPostPage, onClose } = setup();

    navigation.open(POST, sequence());
    ["heart", "download", "postPage"].forEach(icon => findButton(dialog, icon).click());
    expect([addFavorite.mock.calls, download.mock.calls, openPostPage.mock.calls, onClose.mock.calls.length])
      .toEqual([[[POST]], [[POST]], [[POST]], 0]);
  });

  test("asks for fullscreen on the wrapper inside its dialog, since browsers refuse dialogs", () => {
    const { dialog, navigation } = setup();
    const requestFullscreen = vi.fn<() => Promise<void>>(() => Promise.resolve());

    Object.defineProperty(dialog.querySelector(`.${LightboxScreenClass.content}`)!, "requestFullscreen", { value: requestFullscreen });
    navigation.open(POST, sequence());
    findButton(dialog, "fullscreen").click();
    expect(requestFullscreen).toHaveBeenCalledOnce();
  });

  test("steps on from a video when it ends during autoplay", () => {
    const { dialog, navigation, scheduler, onShowNext } = setup();

    navigation.open(VIDEO, sequence());
    findButton(dialog, "play").click();
    scheduler.advance(10_000);
    const callsBeforeEnd = onShowNext.mock.calls.length;

    dialog.querySelector("video:not([hidden])")!.dispatchEvent(new Event("ended"));
    expect([callsBeforeEnd, onShowNext.mock.calls.length]).toEqual([0, 1]);
  });
});
