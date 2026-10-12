import { LightboxScreen, LightboxScreenClass } from "@/core/ui/lightbox/screen/screen";
import { MediaSequence, SequencePosition } from "@/core/domain/media/media_sequence";
import { Mock, describe, expect, onTestFinished, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { Lightbox } from "@/core/ui/lightbox/lightbox";
import { LightboxArrowClass } from "@/core/ui/lightbox/controls/arrow/arrow";
import { LightboxButtonClass } from "@/core/ui/lightbox/controls/button/button";
import { LightboxOverlayClass } from "@/core/ui/lightbox/overlay/overlay";
import { LightboxPositionClass } from "@/core/ui/lightbox/controls/position/position";
import { Media } from "@/core/domain/media/media";
import { MediaItem } from "@/core/domain/post/post";
import { MemoryMorpher } from "@/adapters/memory/ports/morpher/morpher";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import SCREEN_CSS from "@/core/ui/lightbox/screen/screen.css?inline";
import { doNothing } from "@/core/utils/function/function";
import { expectClassesStyled } from "@/testing/css";

const POST: MediaItem = { id: "1", media: { kind: "image", locator: "images/1" } };
const VIDEO: MediaItem = { id: "2", media: { kind: "video", locator: "videos/2.mp4" } };

interface Setup {
  dialog: HTMLDialogElement;
  lightbox: Lightbox<MediaItem>;
  scheduler: MemoryScheduler;
  decodeOriginal: Mock<(media: Media, signal: AbortSignal) => Promise<ImageBitmap>>;
  onShowNext: Mock<() => Promise<void>>;
  onShowPrevious: Mock<() => Promise<void>>;
  onClose: Mock<() => void>;
  onCtrlClick: Mock<(item: MediaItem) => void>;
  onMiddleClick: Mock<(item: MediaItem) => void>;
  onDownload: Mock<(item: MediaItem) => void>;
  onOpenPostPage: Mock<(item: MediaItem) => void>;
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
  const lightbox = new Lightbox<MediaItem>({ warmLimit: 2, maxNeighborDistance: 2 });
  const onShowNext = vi.spyOn(lightbox, "showNext").mockResolvedValue();
  const onShowPrevious = vi.spyOn(lightbox, "showPrevious").mockResolvedValue();
  const onClose = vi.spyOn(lightbox, "close");
  const scheduler = new MemoryScheduler();
  const decodeOriginal = vi.fn<(media: Media, signal: AbortSignal) => Promise<ImageBitmap>>(() => new Promise(doNothing));
  const morpher = new MemoryMorpher();
  const place = document.createElement("div");
  const onCtrlClick = vi.fn<(item: MediaItem) => void>();
  const onMiddleClick = vi.fn<(item: MediaItem) => void>();
  const onDownload = vi.fn<(item: MediaItem) => void>();
  const onOpenPostPage = vi.fn<(item: MediaItem) => void>();
  const addFavorite = vi.fn<(item: MediaItem) => void>();
  const { result, dispose } = render(document, () => (
    <LightboxScreen
      lightbox={lightbox}
      resolvePreviewUrl={media => Promise.resolve(`https://preview/${media.locator}`)}
      resolveOriginalUrl={media => Promise.resolve(`https://original/${media.locator}`)}
      decodeOriginal={decodeOriginal}
      scheduler={scheduler}
      morpher={morpher}
      locateItem={() => place}
      onCtrlClick={onCtrlClick}
      onMiddleClick={onMiddleClick}
      favorites={{ isFavorited: () => false, addFavorite, removeFavorite: doNothing }}
      onDownload={onDownload}
      onOpenPostPage={onOpenPostPage}
    />
  ));

  document.body.append(result);
  onTestFinished(() => {
    dispose();
    result.remove();
  });
  return {
    dialog: result as HTMLDialogElement, lightbox, scheduler, decodeOriginal, onShowNext, onShowPrevious, onClose, onCtrlClick, onMiddleClick,
    onDownload, onOpenPostPage, addFavorite, morpher, place
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

describe("LightboxScreen", () => {
  test("draws a labelled dialog that stays closed until a post is open", () => {
    const { dialog } = setup();

    expect([dialog.tagName, dialog.className, dialog.getAttribute("aria-label"), dialog.open]).toEqual(["DIALOG", LightboxScreenClass.root, "Gallery", false]);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(LightboxScreenClass, SCREEN_CSS);
  });

  test("loads the open post's original on its stage", async() => {
    const { lightbox, scheduler, decodeOriginal } = setup();

    lightbox.open(POST, sequence());
    scheduler.advance(200);
    await vi.waitFor(() => expect(decodeOriginal).toHaveBeenCalledWith(POST.media, expect.any(AbortSignal)));
  });

  test("opens while a post is open and closes once none is", () => {
    const { dialog, lightbox } = setup();

    lightbox.open(POST, sequence());
    expect(dialog.open).toBe(true);
    lightbox.close();
    expect(dialog.open).toBe(false);
  });

  test("stays open without reopening when the shown post changes", () => {
    const { dialog, lightbox } = setup();
    const showModal = vi.spyOn(dialog, "showModal");

    lightbox.open(POST, sequence());
    lightbox.open(VIDEO, sequence());
    expect(dialog.open).toBe(true);
    expect(showModal).toHaveBeenCalledOnce();
  });

  test("reports a close without a morph when the browser dismisses it", async() => {
    const { dialog, lightbox, onClose, morpher } = setup();

    lightbox.open(POST, sequence());
    dialog.close();
    await vi.waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(morpher.morphs).toEqual([]);
  });

  test("morphs the shown image into the item's place as it closes", () => {
    const { dialog, lightbox, morpher, place } = setup();

    lightbox.open(POST, sequence());
    dialog.click();
    expect(morpher.morphs).toEqual([{ source: expect.any(HTMLImageElement), target: place }]);
    expect(dialog.open).toBe(false);
  });

  test("morphs the playing video into the item's place as it closes", () => {
    const { dialog, lightbox, morpher } = setup();

    lightbox.open(VIDEO, sequence());
    const video = dialog.querySelector("video:not([hidden])");

    dialog.click();
    expect(morpher.morphs.map(morph => morph.source)).toEqual([video]);
  });

  test("morphs on Escape instead of letting the browser close it", () => {
    const { dialog, lightbox, morpher } = setup();
    const cancel = new Event("cancel", { cancelable: true });

    lightbox.open(POST, sequence());
    dialog.dispatchEvent(cancel);
    expect(cancel.defaultPrevented).toBe(true);
    expect(morpher.morphs).toHaveLength(1);
  });

  test("hears keys while focus has slipped out of it, and only while it is open", () => {
    const { lightbox, onShowNext } = setup();

    pressKey(document.body, "ArrowRight");
    lightbox.open(POST, sequence());
    pressKey(document.body, "ArrowRight");
    lightbox.close();
    pressKey(document.body, "ArrowRight");
    expect(onShowNext).toHaveBeenCalledOnce();
  });

  test("asks for the next post on a wheel down", () => {
    const { dialog, onShowNext } = setup();

    dialog.dispatchEvent(new WheelEvent("wheel", { deltaY: 100 }));
    expect(onShowNext).toHaveBeenCalledOnce();
  });

  test("stays open when its video is clicked", () => {
    const { dialog, lightbox, onClose } = setup();

    lightbox.open(VIDEO, sequence());
    dialog.querySelector("video:not([hidden])")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onClose).not.toHaveBeenCalled();
  });

  test("reports a Ctrl or Meta click with the shown post and stays open", () => {
    const { dialog, lightbox, onClose, onCtrlClick } = setup();
    const ctrlClick = new MouseEvent("click", { bubbles: true, cancelable: true, ctrlKey: true });

    lightbox.open(POST, sequence());
    dialog.dispatchEvent(ctrlClick);
    dialog.querySelector("img")!.dispatchEvent(new MouseEvent("click", { bubbles: true, metaKey: true }));
    expect([onCtrlClick.mock.calls, ctrlClick.defaultPrevented, onClose.mock.calls.length, dialog.open]).toEqual([[[POST], [POST]], true, 0, true]);
  });

  test("reports a middle click with the shown post and stays open", () => {
    const { dialog, lightbox, onClose, onMiddleClick } = setup();
    const middleClick = new MouseEvent("auxclick", { bubbles: true, cancelable: true, button: 1 });

    lightbox.open(POST, sequence());
    dialog.dispatchEvent(middleClick);
    expect([onMiddleClick.mock.calls, middleClick.defaultPrevented, onClose.mock.calls.length, dialog.open]).toEqual([[[POST]], true, 0, true]);
  });

  test("shows its overlay on open and hides it and the cursor once idle", () => {
    const { dialog, lightbox, scheduler } = setup();

    lightbox.open(POST, sequence());
    expect([findOverlay(dialog).dataset.shown, dialog.dataset.idle]).toEqual(["true", "false"]);
    scheduler.advance(2_000);
    expect([findOverlay(dialog).dataset.shown, dialog.dataset.idle]).toEqual(["false", "true"]);
  });

  test("shows its overlay again when the mouse moves", () => {
    const { dialog, lightbox, scheduler } = setup();

    lightbox.open(POST, sequence());
    scheduler.advance(2_000);
    movePointer(dialog, { screenX: 10 });
    expect(findOverlay(dialog).dataset.shown).toBe("true");
  });

  test("doesn't show its overlay on keys", () => {
    const { dialog, lightbox, scheduler } = setup();

    lightbox.open(POST, sequence());
    scheduler.advance(2_000);
    pressKey(dialog, "ArrowRight");
    expect(findOverlay(dialog).dataset.shown).toBe("false");
  });

  test("hides its overlay on close", () => {
    const { dialog, lightbox } = setup();

    lightbox.open(POST, sequence());
    lightbox.close();
    expect(findOverlay(dialog).dataset.shown).toBe("false");
  });

  test("morphs into the item's place when its close button is clicked", () => {
    const { dialog, lightbox, morpher, place } = setup();

    lightbox.open(POST, sequence());
    dialog.querySelector<HTMLElement>(`.${LightboxButtonClass.root}[data-icon="close"]`)!.click();
    expect([morpher.morphs.map(morph => morph.target), dialog.open]).toEqual([[place], false]);
  });

  test("asks for the next post from its arrow without closing", () => {
    const { dialog, lightbox, onShowNext, onClose } = setup();

    lightbox.open(POST, sequence());
    dialog.querySelector<HTMLElement>(`.${LightboxArrowClass.root}[data-direction="next"]`)!.click();
    expect([onShowNext.mock.calls.length, onClose.mock.calls.length]).toEqual([1, 0]);
  });

  test("toggles autoplay with Space", () => {
    const { dialog, lightbox } = setup();

    lightbox.open(POST, sequence());
    pressKey(dialog, " ");
    expect(findButton(dialog, "pause")).not.toBeNull();
  });

  test("steps to the next post when autoplay's interval passes", () => {
    const { dialog, lightbox, scheduler, onShowNext } = setup();

    lightbox.open(POST, sequence());
    findButton(dialog, "play")!.click();
    scheduler.advance(3_000);
    expect(onShowNext).toHaveBeenCalledOnce();
  });

  test("steps on from a video when it ends during autoplay", () => {
    const { dialog, lightbox, scheduler, onShowNext } = setup();

    lightbox.open(VIDEO, sequence());
    findButton(dialog, "play")!.click();
    scheduler.advance(10_000);
    expect(onShowNext).not.toHaveBeenCalled();
    dialog.querySelector("video:not([hidden])")!.dispatchEvent(new Event("ended"));
    expect(onShowNext).toHaveBeenCalledOnce();
  });

  test("stops autoplay when it closes", () => {
    const { dialog, lightbox } = setup();

    lightbox.open(POST, sequence());
    findButton(dialog, "play")!.click();
    lightbox.close();
    lightbox.open(POST, sequence());
    expect(findButton(dialog, "play")).not.toBeNull();
  });

  test("reports the shown post to its favorite, download, and post page buttons without closing", () => {
    const { dialog, lightbox, addFavorite, onDownload, onOpenPostPage, onClose } = setup();

    lightbox.open(POST, sequence());
    ["heart", "download", "postPage"].forEach(icon => findButton(dialog, icon)!.click());
    expect([addFavorite.mock.calls, onDownload.mock.calls, onOpenPostPage.mock.calls, onClose.mock.calls.length])
      .toEqual([[[POST]], [[POST]], [[POST]], 0]);
  });

  test("asks for fullscreen on the wrapper inside its dialog, since browsers refuse dialogs", () => {
    const { dialog, lightbox } = setup();
    const requestFullscreen = vi.fn<() => Promise<void>>(() => Promise.resolve());

    Object.defineProperty(dialog.querySelector(`.${LightboxScreenClass.content}`)!, "requestFullscreen", { value: requestFullscreen });
    lightbox.open(POST, sequence());
    findButton(dialog, "fullscreen")!.click();
    expect(requestFullscreen).toHaveBeenCalledOnce();
  });

  test("stays open when a control in its overlay is clicked", () => {
    const { dialog, lightbox, onClose } = setup();

    lightbox.open(POST, sequence());
    (findOverlay(dialog).querySelector(`.${LightboxPositionClass.root}`) as HTMLElement).click();
    expect(onClose).not.toHaveBeenCalled();
  });

  test("doesn't report a close it was told to make", async() => {
    const { lightbox, onClose } = setup();

    lightbox.open(POST, sequence());
    lightbox.close();
    await new Promise(resolve => setTimeout(resolve));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
