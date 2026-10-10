import { LightboxScreen, LightboxScreenClass } from "@/core/ui/lightbox/screen/screen";
import { Mock, describe, expect, onTestFinished, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import LIGHTBOX_CSS from "@/core/ui/lightbox/lightbox.css?inline";
import { LightboxStageClass } from "@/core/ui/lightbox/stage/stage_class";
import { Lightbox } from "@/core/ui/lightbox/lightbox";
import { Media } from "@/core/domain/media/media";
import { MediaItem } from "@/core/domain/post/post";
import { MemoryBitmapDecoder } from "@/adapters/memory/ports/bitmap_decoder/bitmap_decoder";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { MediaSequence, SequencePosition } from "@/core/contracts/media_sequence";
import { doNothing } from "@/core/utils/function/function";
import { expectClassesStyled } from "@/testing/css";

const POST: MediaItem = { id: "1", media: { kind: "image", locator: "images/1" } };
const VIDEO: MediaItem = { id: "2", media: { kind: "video", locator: "videos/2.mp4" } };

interface Setup {
  dialog: HTMLDialogElement;
  lightbox: Lightbox<MediaItem>;
  scheduler: MemoryScheduler;
  fetchOriginal: Mock<(media: Media, signal: AbortSignal) => Promise<Blob>>;
  onShowNext: Mock<() => Promise<void>>;
  onShowPrevious: Mock<() => Promise<void>>;
  onClose: Mock<() => void>;
}

function sequence(position: SequencePosition | undefined = { index: 0, total: 1 }): MediaSequence<MediaItem> {
  return {
    getNext: () => Promise.resolve(undefined),
    getPrevious: () => Promise.resolve(undefined),
    positionOf: () => position
  };
}

function setup(): Setup {
  const lightbox = new Lightbox<MediaItem>();
  const onShowNext = vi.spyOn(lightbox, "showNext").mockResolvedValue();
  const onShowPrevious = vi.spyOn(lightbox, "showPrevious").mockResolvedValue();
  const onClose = vi.spyOn(lightbox, "close");
  const scheduler = new MemoryScheduler();
  const fetchOriginal = vi.fn<(media: Media, signal: AbortSignal) => Promise<Blob>>(() => new Promise(doNothing));
  const { result, dispose } = render(document, () => (
    <LightboxScreen
      lightbox={lightbox}
      resolvePreviewUrl={media => Promise.resolve(`https://preview/${media.locator}`)}
      resolveOriginalUrl={media => Promise.resolve(`https://original/${media.locator}`)}
      fetchOriginal={fetchOriginal}
      bitmapDecoder={new MemoryBitmapDecoder()}
      scheduler={scheduler}
    />
  ));

  document.body.append(result);
  onTestFinished(() => {
    dispose();
    result.remove();
  });
  return { dialog: result as HTMLDialogElement, lightbox, scheduler, fetchOriginal, onShowNext, onShowPrevious, onClose };
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
    const { lightbox, scheduler, fetchOriginal } = setup();

    lightbox.open(POST, sequence());
    scheduler.advance(200);
    await vi.waitFor(() => expect(fetchOriginal).toHaveBeenCalledWith(POST.media, expect.any(AbortSignal)));
  });

  test("opens while a post is open and closes once none is", () => {
    const { dialog, lightbox } = setup();

    lightbox.open(POST, sequence());
    expect(dialog.open).toBe(true);
    lightbox.close();
    expect(dialog.open).toBe(false);
  });

  test("reports a close when the browser dismisses it", async() => {
    const { dialog, lightbox, onClose } = setup();

    lightbox.open(POST, sequence());
    dialog.close();
    await vi.waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  });

  test("asks for the next post on the right arrow and the previous one on the left", () => {
    const { dialog, onShowNext, onShowPrevious } = setup();

    pressKey(dialog, "ArrowRight");
    pressKey(dialog, "ArrowLeft");
    pressKey(dialog, "ArrowRight");
    expect([onShowNext.mock.calls.length, onShowPrevious.mock.calls.length]).toEqual([2, 1]);
  });

  test("keeps the arrow keys from scrolling and leaves other keys alone", () => {
    const { dialog } = setup();

    expect([pressKey(dialog, "ArrowRight").defaultPrevented, pressKey(dialog, "a").defaultPrevented]).toEqual([true, false]);
  });

  test("hears the arrow keys pressed on its stage", () => {
    const { dialog, onShowNext } = setup();

    pressKey(dialog.querySelector(`.${LightboxStageClass.root}`)!, "ArrowRight");
    expect(onShowNext).toHaveBeenCalledOnce();
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

  test("leaves video double clicks to the browser", () => {
    const { dialog, lightbox, onClose } = setup();

    lightbox.open(VIDEO, sequence());
    const video = dialog.querySelector("video:not([hidden])")!;
    const nativeClick = vi.fn();
    const nativeDoubleClick = vi.fn();

    video.addEventListener("click", nativeClick);
    video.addEventListener("dblclick", nativeDoubleClick);

    const secondClick = new MouseEvent("click", { bubbles: true, cancelable: true, detail: 2 });

    video.dispatchEvent(secondClick);

    expect(secondClick.defaultPrevented).toBe(false);
    expect(nativeClick).toHaveBeenCalledOnce();

    const doubleClick = new MouseEvent("dblclick", { bubbles: true, cancelable: true, detail: 2 });

    video.dispatchEvent(doubleClick);

    expect(doubleClick.defaultPrevented).toBe(false);
    expect(nativeDoubleClick).toHaveBeenCalledOnce();
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
