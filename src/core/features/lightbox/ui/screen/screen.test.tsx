import { LightboxScreen, LightboxScreenClass } from "@/core/features/lightbox/ui/screen/screen";
import { MediaSequence, SequencePosition } from "@/core/domain/media/media_sequence";
import { Mock, describe, expect, onTestFinished, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { LightboxArrowClass } from "@/core/features/lightbox/ui/controls/arrow/arrow";
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
import SCREEN_CSS from "@/core/features/lightbox/ui/screen/screen.css?inline";
import { doNothing } from "@/core/utils/function/function";
import { expectClassesStyled } from "@/testing/css";

const POST: MediaItem = { id: "1", media: { kind: "image", locator: "images/1" } };
const VIDEO: MediaItem = { id: "2", media: { kind: "video", locator: "videos/2.mp4" } };

interface Setup {
  dialog: HTMLDialogElement;
  navigation: LightboxNavigation<MediaItem>;
  scheduler: MemoryScheduler;
  decodeOriginal: Mock<(media: Media, signal?: AbortSignal) => Promise<ImageBitmap>>;
  onShowNext: Mock<() => Promise<void>>;
  onShowPrevious: Mock<() => Promise<void>>;
  onClose: Mock<() => void>;
  openOriginal: Mock<(item: MediaItem) => void>;
  openPostPage: Mock<(item: MediaItem) => void>;
  download: Mock<(item: MediaItem) => void>;
  addFavorite: Mock<(item: MediaItem) => void>;
  morpher: MemoryMorpher;
  place: HTMLElement;
}

function sequence(position: SequencePosition | undefined = { index: 0, total: 1 }): MediaSequence<MediaItem> {
  return {
    getNext: () => Promise.resolve(undefined),
    getPrevious: () => Promise.resolve(undefined),
    positionOf: () => position
  };
}

function setup(): Setup {
  const navigation = new LightboxNavigation<MediaItem>({ maxWarmItems: 2, maxNeighborDistance: 2 });
  const onShowNext = vi.spyOn(navigation, "showNext").mockResolvedValue();
  const onShowPrevious = vi.spyOn(navigation, "showPrevious").mockResolvedValue();
  const onClose = vi.spyOn(navigation, "close");
  const scheduler = new MemoryScheduler();
  const autoplay = new LightboxAutoplay({ interval: 3_000 }, {
    current: navigation.current,
    showNext: (): void => {
      navigation.showNext().catch(console.error);
    },
    scheduler
  });
  const zoom = new LightboxZoom({ minimumScale: 2 }, { current: navigation.current });
  const decodeOriginal = vi.fn<(media: Media, signal?: AbortSignal) => Promise<ImageBitmap>>(() => new Promise(doNothing));
  const morpher = new MemoryMorpher();
  const place = document.createElement("div");
  const openOriginal = vi.fn<(item: MediaItem) => void>();
  const openPostPage = vi.fn<(item: MediaItem) => void>();
  const download = vi.fn<(item: MediaItem) => void>();
  const addFavorite = vi.fn<(item: MediaItem) => void>();
  const { result, dispose } = render(document, () => (
    <LightboxScreen
      navigation={navigation}
      autoplay={autoplay}
      zoom={zoom}
      actions={{ openOriginal, openPostPage, download }}
      remoteMedia={{
        resolvePreviewUrl: media => Promise.resolve(`https://preview/${media.locator}`),
        resolveOriginalUrl: media => Promise.resolve(`https://original/${media.locator}`),
        decodeOriginal
      }}
      overlay={{ idleDelay: 1_000, hideSoonDelay: 1_000 }}
      scheduler={scheduler}
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
    dialog: result as HTMLDialogElement, navigation, scheduler, decodeOriginal, onShowNext, onShowPrevious, onClose,
    openOriginal, openPostPage, download, addFavorite, morpher, place
  };
}

function findButton(dialog: HTMLDialogElement, icon: string): HTMLElement | null {
  return dialog.querySelector<HTMLElement>(`.${LightboxButtonClass.root}[data-icon="${icon}"]`);
}

function findOverlay(dialog: HTMLDialogElement): HTMLElement {
  return dialog.querySelector<HTMLElement>(`.${LightboxOverlayClass.root}`)!;
}

function movePointer(target: Element, init: PointerEventInit): void {
  target.dispatchEvent(new PointerEvent("pointermove", { pointerType: "mouse", bubbles: true, ...init }));
}

function pressKey(target: Element, key: string): KeyboardEvent {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });

  target.dispatchEvent(event);
  return event;
}

function layOutLargeImage(dialog: HTMLDialogElement): HTMLElement {
  const stageRoot = dialog.querySelector<HTMLElement>(`.${LightboxStageClass.root}`)!;
  const preview = dialog.querySelector<HTMLImageElement>(`img.${LightboxStageRendererClass.media}`)!;

  Object.defineProperties(stageRoot, { clientWidth: { value: 1_000 }, clientHeight: { value: 500 } });
  Object.defineProperties(preview, { naturalWidth: { value: 4_000 }, naturalHeight: { value: 2_000 } });
  return stageRoot;
}

describe("LightboxScreen", () => {  test("zooms from its button and from a Shift click, and zooms out on a plain click", () => {
    const { dialog, navigation, onClose } = setup();
    const zoomedStates: (string | undefined)[] = [];

    navigation.open(POST, sequence());
    layOutLargeImage(dialog);
    findButton(dialog, "zoomIn")!.click();
    zoomedStates.push(dialog.dataset.zoomed);
    dialog.click();
    zoomedStates.push(dialog.dataset.zoomed);
    dialog.dispatchEvent(new MouseEvent("click", { shiftKey: true, clientX: 100, clientY: 100, bubbles: true }));
    zoomedStates.push(dialog.dataset.zoomed);
    expect([zoomedStates, onClose.mock.calls.length]).toEqual([["true", "false", "true"], 0]);
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

  test("pans the zoomed image by dragging it", () => {
    const { dialog, navigation } = setup();

    navigation.open(POST, sequence());
    const stageRoot = layOutLargeImage(dialog);

    findButton(dialog, "zoomIn")!.click();
    dialog.dispatchEvent(new PointerEvent("pointerdown", { button: 0, clientX: 500, clientY: 250, bubbles: true }));
    movePointer(dialog, { clientX: 520, clientY: 260 });
    dialog.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
    expect(stageRoot.style.transform).toBe("translate(-1480px, -740px) scale(4)");
  });

  test("zooms at the pointer on a Ctrl wheel at once, then pans with the plain wheel instead of stepping", () => {
    const { dialog, navigation, onShowNext } = setup();
    const ctrlWheel = new WheelEvent("wheel", { deltaY: -100 });
    const readTranslation = (root: HTMLElement): string => root.style.transform.replace(/ scale\(.*\)/, "");

    navigation.open(POST, sequence());
    const stageRoot = layOutLargeImage(dialog);

    // happy-dom's WheelEvent extends UIEvent, so it drops ctrlKey and the pointer's place from its init.
    Object.defineProperties(ctrlWheel, { ctrlKey: { value: true }, clientX: { value: 0 }, clientY: { value: 0 } });
    dialog.dispatchEvent(ctrlWheel);
    const zoomedTranslation = readTranslation(stageRoot);

    dialog.dispatchEvent(new WheelEvent("wheel", { deltaY: 100 }));
    expect([zoomedTranslation, dialog.dataset.zoomed, stageRoot.dataset.zoomMotion, onShowNext.mock.calls.length])
      .toEqual(["translate(0px, 0px)", "true", "instant", 0]);
    expect(readTranslation(stageRoot)).toMatch(/^translate\(0px, -\d/);
  });

  test("shows the zoom chip and minimap only while zoomed", () => {
    const { dialog, navigation } = setup();
    const findHidden = (): boolean[] => [LightboxZoomChipClass.root, LightboxMinimapClass.root]
      .map(className => dialog.querySelector<HTMLElement>(`.${className}`)!.hidden);
    const states = [findHidden()];

    navigation.open(POST, sequence());
    layOutLargeImage(dialog);
    findButton(dialog, "zoomIn")!.click();
    states.push(findHidden());
    dialog.click();
    states.push(findHidden());
    expect(states).toEqual([[true, true], [false, false], [true, true]]);
  });
  test("draws a labelled dialog that stays closed until a post is open", () => {
    const { dialog } = setup();

    expect([dialog.tagName, dialog.className, dialog.getAttribute("aria-label"), dialog.open]).toEqual(["DIALOG", LightboxScreenClass.root, "Gallery", false]);
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

    navigation.open(POST, sequence());
    expect(dialog.open).toBe(true);
    navigation.close();
    expect(dialog.open).toBe(false);
  });

  test("stays open without reopening when the shown post changes", () => {
    const { dialog, navigation } = setup();
    const showModal = vi.spyOn(dialog, "showModal");

    navigation.open(POST, sequence());
    navigation.open(VIDEO, sequence());
    expect(dialog.open).toBe(true);
    expect(showModal).toHaveBeenCalledOnce();
  });

  test("reports a close without a morph when the browser dismisses it", async() => {
    const { dialog, navigation, onClose, morpher } = setup();

    navigation.open(POST, sequence());
    dialog.close();
    await vi.waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(morpher.morphs).toEqual([]);
  });

  test("morphs the shown image into the item's place as it closes", () => {
    const { dialog, navigation, morpher, place } = setup();

    navigation.open(POST, sequence());
    dialog.click();
    expect(morpher.morphs).toEqual([{ source: expect.any(HTMLImageElement), target: place }]);
    expect(dialog.open).toBe(false);
  });

  test("morphs the playing video into the item's place as it closes", () => {
    const { dialog, navigation, morpher } = setup();

    navigation.open(VIDEO, sequence());
    const video = dialog.querySelector("video:not([hidden])");

    dialog.click();
    expect(morpher.morphs.map(morph => morph.source)).toEqual([video]);
  });

  test("morphs on Escape instead of letting the browser close it", () => {
    const { dialog, navigation, morpher } = setup();
    const cancel = new Event("cancel", { cancelable: true });

    navigation.open(POST, sequence());
    dialog.dispatchEvent(cancel);
    expect(cancel.defaultPrevented).toBe(true);
    expect(morpher.morphs).toHaveLength(1);
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

  test("asks for the next post on a wheel down", () => {
    const { dialog, onShowNext } = setup();

    dialog.dispatchEvent(new WheelEvent("wheel", { deltaY: 100 }));
    expect(onShowNext).toHaveBeenCalledOnce();
  });

  test("asks for the previous post on a wheel up", () => {
    const { dialog, onShowPrevious } = setup();

    dialog.dispatchEvent(new WheelEvent("wheel", { deltaY: -100 }));
    expect(onShowPrevious).toHaveBeenCalledOnce();
  });

  test("ignores a Ctrl click while no post is shown", () => {
    const { dialog, openOriginal } = setup();

    dialog.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, ctrlKey: true }));
    expect(openOriginal).not.toHaveBeenCalled();
  });

  test("stays open when its video is clicked", () => {
    const { dialog, navigation, onClose } = setup();

    navigation.open(VIDEO, sequence());
    dialog.querySelector("video:not([hidden])")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onClose).not.toHaveBeenCalled();
  });

  test("opens the shown post's original on a Ctrl or Meta click and stays open", () => {
    const { dialog, navigation, onClose, openOriginal } = setup();
    const ctrlClick = new MouseEvent("click", { bubbles: true, cancelable: true, ctrlKey: true });

    navigation.open(POST, sequence());
    dialog.dispatchEvent(ctrlClick);
    dialog.querySelector("img")!.dispatchEvent(new MouseEvent("click", { bubbles: true, metaKey: true }));
    expect([openOriginal.mock.calls, ctrlClick.defaultPrevented, onClose.mock.calls.length, dialog.open]).toEqual([[[POST], [POST]], true, 0, true]);
  });

  test("opens the shown post's page on a middle click and stays open", () => {
    const { dialog, navigation, onClose, openPostPage } = setup();
    const middleClick = new MouseEvent("auxclick", { bubbles: true, cancelable: true, button: 1 });

    navigation.open(POST, sequence());
    dialog.dispatchEvent(middleClick);
    expect([openPostPage.mock.calls, middleClick.defaultPrevented, onClose.mock.calls.length, dialog.open]).toEqual([[[POST]], true, 0, true]);
  });

  test("shows its overlay on open and hides it and the cursor once idle", () => {
    const { dialog, navigation, scheduler } = setup();

    navigation.open(POST, sequence());
    expect([findOverlay(dialog).dataset.shown, dialog.dataset.idle]).toEqual(["true", "false"]);
    scheduler.advance(2_000);
    expect([findOverlay(dialog).dataset.shown, dialog.dataset.idle]).toEqual(["false", "true"]);
  });

  test("shows its overlay again when the mouse moves", () => {
    const { dialog, navigation, scheduler } = setup();

    navigation.open(POST, sequence());
    scheduler.advance(2_000);
    movePointer(dialog, { screenX: 10 });
    expect(findOverlay(dialog).dataset.shown).toBe("true");
  });

  test("doesn't show its overlay on keys", () => {
    const { dialog, navigation, scheduler } = setup();

    navigation.open(POST, sequence());
    scheduler.advance(2_000);
    pressKey(dialog, "ArrowRight");
    expect(findOverlay(dialog).dataset.shown).toBe("false");
  });

  test("hides its overlay on close", () => {
    const { dialog, navigation } = setup();

    navigation.open(POST, sequence());
    navigation.close();
    expect(findOverlay(dialog).dataset.shown).toBe("false");
  });

  test("morphs into the item's place when its close button is clicked", () => {
    const { dialog, navigation, morpher, place } = setup();

    navigation.open(POST, sequence());
    dialog.querySelector<HTMLElement>(`.${LightboxButtonClass.root}[data-icon="close"]`)!.click();
    expect([morpher.morphs.map(morph => morph.target), dialog.open]).toEqual([[place], false]);
  });

  test("asks for the next post from its arrow without closing", () => {
    const { dialog, navigation, onShowNext, onClose } = setup();

    navigation.open(POST, sequence());
    dialog.querySelector<HTMLElement>(`.${LightboxArrowClass.root}[data-direction="next"]`)!.click();
    expect([onShowNext.mock.calls.length, onClose.mock.calls.length]).toEqual([1, 0]);
  });

  test("toggles autoplay with Space", () => {
    const { dialog, navigation } = setup();

    navigation.open(POST, sequence());
    pressKey(dialog, " ");
    expect(findButton(dialog, "pause")).not.toBeNull();
  });

  test("steps to the next post when autoplay's interval passes", () => {
    const { dialog, navigation, scheduler, onShowNext } = setup();

    navigation.open(POST, sequence());
    findButton(dialog, "play")!.click();
    scheduler.advance(3_000);
    expect(onShowNext).toHaveBeenCalledOnce();
  });

  test("steps on from a video when it ends during autoplay", () => {
    const { dialog, navigation, scheduler, onShowNext } = setup();

    navigation.open(VIDEO, sequence());
    findButton(dialog, "play")!.click();
    scheduler.advance(10_000);
    expect(onShowNext).not.toHaveBeenCalled();
    dialog.querySelector("video:not([hidden])")!.dispatchEvent(new Event("ended"));
    expect(onShowNext).toHaveBeenCalledOnce();
  });

  test("ignores a hidden video ending during autoplay", () => {
    const { dialog, navigation, onShowNext } = setup();

    navigation.open(VIDEO, sequence());
    findButton(dialog, "play")!.click();
    dialog.querySelector("video[hidden]")!.dispatchEvent(new Event("ended"));
    expect(onShowNext).not.toHaveBeenCalled();
  });

  test("reports the shown post to its favorite, download, and post page buttons without closing", () => {
    const { dialog, navigation, addFavorite, download, openPostPage, onClose } = setup();

    navigation.open(POST, sequence());
    ["heart", "download", "postPage"].forEach(icon => findButton(dialog, icon)!.click());
    expect([addFavorite.mock.calls, download.mock.calls, openPostPage.mock.calls, onClose.mock.calls.length])
      .toEqual([[[POST]], [[POST]], [[POST]], 0]);
  });

  test("asks for fullscreen on the wrapper inside its dialog, since browsers refuse dialogs", () => {
    const { dialog, navigation } = setup();
    const requestFullscreen = vi.fn<() => Promise<void>>(() => Promise.resolve());

    Object.defineProperty(dialog.querySelector(`.${LightboxScreenClass.content}`)!, "requestFullscreen", { value: requestFullscreen });
    navigation.open(POST, sequence());
    findButton(dialog, "fullscreen")!.click();
    expect(requestFullscreen).toHaveBeenCalledOnce();
  });

  test("stays open when a control in its overlay is clicked", () => {
    const { dialog, navigation, onClose } = setup();

    navigation.open(POST, sequence());
    (findOverlay(dialog).querySelector(`.${LightboxPositionClass.root}`) as HTMLElement).click();
    expect(onClose).not.toHaveBeenCalled();
  });

  test("doesn't report a close it was told to make", async() => {
    const { navigation, onClose } = setup();

    navigation.open(POST, sequence());
    navigation.close();
    await new Promise(resolve => setTimeout(resolve));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
