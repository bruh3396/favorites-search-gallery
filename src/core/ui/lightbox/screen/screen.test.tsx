import { LightboxScreen, LightboxScreenClass } from "@/core/ui/lightbox/screen/screen";
import { MediaSequence, SequencePosition } from "@/core/domain/media/media_sequence";
import { Mock, describe, expect, onTestFinished, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import LIGHTBOX_CSS from "@/core/ui/lightbox/lightbox.css?inline";
import { Lightbox } from "@/core/ui/lightbox/lightbox";
import { LightboxStageClass } from "@/core/ui/lightbox/stage/stage";
import { Media } from "@/core/domain/media/media";
import { MediaItem } from "@/core/domain/post/post";
import { MemoryMorpher } from "@/adapters/memory/ports/morpher/morpher";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
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

function setup({ morphs = true } = {}): Setup {
  const lightbox = new Lightbox<MediaItem>({ warmLimit: 2, maxNeighborDistance: 2 });
  const onShowNext = vi.spyOn(lightbox, "showNext").mockResolvedValue();
  const onShowPrevious = vi.spyOn(lightbox, "showPrevious").mockResolvedValue();
  const onClose = vi.spyOn(lightbox, "close");
  const scheduler = new MemoryScheduler();
  const decodeOriginal = vi.fn<(media: Media, signal: AbortSignal) => Promise<ImageBitmap>>(() => new Promise(doNothing));
  const morpher = new MemoryMorpher();
  const place = document.createElement("div");
  const { result, dispose } = render(document, () => (
    <LightboxScreen
      lightbox={lightbox}
      resolvePreviewUrl={media => Promise.resolve(`https://preview/${media.locator}`)}
      resolveOriginalUrl={media => Promise.resolve(`https://original/${media.locator}`)}
      decodeOriginal={decodeOriginal}
      scheduler={scheduler}
      morpher={morphs ? morpher : undefined}
      locateItem={() => place}
    />
  ));

  document.body.append(result);
  onTestFinished(() => {
    dispose();
    result.remove();
  });
  return { dialog: result as HTMLDialogElement, lightbox, scheduler, decodeOriginal, onShowNext, onShowPrevious, onClose, morpher, place };
}

function findPositionLabel(dialog: HTMLDialogElement): HTMLElement {
  return dialog.querySelector<HTMLElement>(`.${LightboxScreenClass.position}`)!;
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
    expectClassesStyled(LightboxScreenClass, LIGHTBOX_CSS);
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

  test("closes without a morph when nothing is shown", () => {
    const { dialog, onClose, morpher } = setup();

    dialog.click();
    expect(onClose).toHaveBeenCalledOnce();
    expect(morpher.morphs).toEqual([]);
  });

  test("closes without a morph when it has no morpher", () => {
    const { dialog, lightbox, onClose, morpher } = setup({ morphs: false });

    lightbox.open(POST, sequence());
    dialog.click();
    expect([onClose.mock.calls.length, dialog.open, morpher.morphs]).toEqual([1, false, []]);
  });

  test("asks for the next post on the right arrow and the previous one on the left", () => {
    const { dialog, onShowNext, onShowPrevious } = setup();

    pressKey(dialog, "ArrowRight");
    pressKey(dialog, "ArrowLeft");
    pressKey(dialog, "ArrowRight");
    expect([onShowNext.mock.calls.length, onShowPrevious.mock.calls.length]).toEqual([2, 1]);
  });

  test("hears the arrow keys pressed on its stage", () => {
    const { dialog, onShowNext } = setup();

    pressKey(dialog.querySelector(`.${LightboxStageClass.root}`)!, "ArrowRight");
    expect(onShowNext).toHaveBeenCalledOnce();
  });

  test("leaves keys it doesn't use to the browser", () => {
    const { dialog, onShowNext, onShowPrevious, onClose } = setup();

    expect(pressKey(dialog, "x").defaultPrevented).toBe(false);
    expect([onShowNext, onShowPrevious, onClose].map(action => action.mock.calls.length)).toEqual([0, 0, 0]);
  });

  test("asks for the next post on a wheel down and the previous one on a wheel up", () => {
    const { dialog, onShowNext, onShowPrevious } = setup();
    const down = new WheelEvent("wheel", { deltaY: 100, cancelable: true });

    dialog.dispatchEvent(down);
    dialog.dispatchEvent(new WheelEvent("wheel", { deltaY: -100 }));
    expect(down.defaultPrevented).toBe(true);
    expect([onShowNext.mock.calls.length, onShowPrevious.mock.calls.length]).toEqual([1, 1]);
  });

  test("leaves a ctrl wheel and a sideways wheel to the browser", () => {
    const { dialog, onShowNext, onShowPrevious } = setup();
    const zoom = new WheelEvent("wheel", { deltaY: 100, cancelable: true });

    // happy-dom's WheelEvent extends UIEvent, so it drops ctrlKey from its init.
    Object.defineProperty(zoom, "ctrlKey", { value: true });
    dialog.dispatchEvent(zoom);
    dialog.dispatchEvent(new WheelEvent("wheel", { deltaX: 100 }));
    expect(zoom.defaultPrevented).toBe(false);
    expect([onShowNext.mock.calls.length, onShowPrevious.mock.calls.length]).toEqual([0, 0]);
  });

  test("closes on a right click instead of opening the context menu", () => {
    const { dialog, onClose } = setup();
    const contextMenu = new MouseEvent("contextmenu", { cancelable: true });

    dialog.dispatchEvent(contextMenu);
    expect(contextMenu.defaultPrevented).toBe(true);
    expect(onClose).toHaveBeenCalledOnce();
  });

  test("closes when its backdrop is clicked", () => {
    const { dialog, onClose } = setup();

    dialog.click();
    expect(onClose).toHaveBeenCalledOnce();
  });

  test("stays open when its video is clicked", () => {
    const { dialog, lightbox, onClose } = setup();

    lightbox.open(VIDEO, sequence());
    dialog.querySelector("video:not([hidden])")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onClose).not.toHaveBeenCalled();
  });

  test("shows the post's place counted from one, out of the total", () => {
    const { dialog, lightbox } = setup();

    lightbox.open(POST, sequence({ index: 36, total: 1_204 }));
    expect([findPositionLabel(dialog).hidden, findPositionLabel(dialog).textContent]).toEqual([false, `37 / ${(1_204).toLocaleString()}`]);
  });

  test("shows only the place when the total is unknown", () => {
    const { dialog, lightbox } = setup();

    lightbox.open(POST, sequence({ index: 4, total: undefined }));
    expect(findPositionLabel(dialog).textContent).toBe("5");
  });

  test("hides the place when it is unknown", () => {
    const { dialog, lightbox } = setup();

    lightbox.open(POST, sequence({ index: 0, total: 3 }));
    lightbox.close();
    expect(findPositionLabel(dialog).hidden).toBe(true);
  });

  test("doesn't report a close it was told to make", async() => {
    const { lightbox, onClose } = setup();

    lightbox.open(POST, sequence());
    lightbox.close();
    await new Promise(resolve => setTimeout(resolve));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
