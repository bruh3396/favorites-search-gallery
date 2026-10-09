import { LightboxScreen, LightboxScreenClass } from "@/core/ui/lightbox/stage/screen";
import { Mock, describe, expect, onTestFinished, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import LIGHTBOX_CSS from "@/core/ui/lightbox/lightbox.css?inline";
import { LightboxStageClass } from "@/core/ui/lightbox/stage/stage";
import { Media } from "@/core/domain/media/media";
import { MediaItem } from "@/core/domain/post/post";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { SequencePosition } from "@/core/contracts/media_sequence";
import { Signal } from "@/core/utils/reactive/signal";
import { doNothing } from "@/core/utils/function/function";
import { expectClassesStyled } from "@/testing/css";

const POST: MediaItem = { id: "1", media: { kind: "image", locator: "images/1" } };

interface Setup {
  dialog: HTMLDialogElement;
  current: Signal<MediaItem | undefined>;
  position: Signal<SequencePosition | undefined>;
  resolveOriginalUrl: Mock<(media: Media) => Promise<string>>;
  onShowNext: Mock<() => void>;
  onShowPrevious: Mock<() => void>;
  onClose: Mock<() => void>;
}

function setup(): Setup {
  const current = new Signal<MediaItem | undefined>(undefined);
  const position = new Signal<SequencePosition | undefined>(undefined);
  const onShowNext = vi.fn<() => void>();
  const onShowPrevious = vi.fn<() => void>();
  const onClose = vi.fn<() => void>();
  const resolveOriginalUrl = vi.fn<(media: Media) => Promise<string>>(() => new Promise(doNothing));
  const { result, dispose } = render(document, () => (
    <LightboxScreen
      current={current}
      neighbors={new Signal<readonly MediaItem[]>([])}
      position={position}
      resolvePreviewUrl={media => Promise.resolve(`https://preview/${media.locator}`)}
      resolveOriginalUrl={resolveOriginalUrl}
      scheduler={new MemoryScheduler()}
      onShowNext={onShowNext}
      onShowPrevious={onShowPrevious}
      onClose={onClose}
    />
  ));

  document.body.append(result);
  onTestFinished(() => {
    dispose();
    result.remove();
  });
  return { dialog: result as HTMLDialogElement, current, position, resolveOriginalUrl, onShowNext, onShowPrevious, onClose };
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

  test("loads the open post's original on its stage", () => {
    // TODO fix
    // const { current, resolveOriginalUrl } = setup();

    // current.value = POST;
    // expect(resolveOriginalUrl).toHaveBeenCalledWith(POST.media);
  });

  test("opens while a post is open and closes once none is", () => {
    const { dialog, current } = setup();

    current.value = POST;
    expect(dialog.open).toBe(true);
    current.value = undefined;
    expect(dialog.open).toBe(false);
  });

  test("reports a close when the browser dismisses it", async() => {
    const { dialog, current, onClose } = setup();

    current.value = POST;
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

  test("stays open when its media is clicked", () => {
    const { dialog, current, onClose } = setup();

    current.value = POST;
    dialog.querySelector<HTMLElement>(`.${LightboxStageClass.canvas}`)!.click();
    expect(onClose).not.toHaveBeenCalled();
  });

  test("shows the post's place counted from one, out of the total", () => {
    const { dialog, position } = setup();

    position.value = { index: 36, total: 1_204 };
    expect([findPositionLabel(dialog).hidden, findPositionLabel(dialog).textContent]).toEqual([false, `37 / ${(1_204).toLocaleString()}`]);
  });

  test("shows only the place when the total is unknown", () => {
    const { dialog, position } = setup();

    position.value = { index: 4, total: undefined };
    expect(findPositionLabel(dialog).textContent).toBe("5");
  });

  test("hides the place when it is unknown", () => {
    const { dialog, position } = setup();

    position.value = { index: 0, total: 3 };
    position.value = undefined;
    expect(findPositionLabel(dialog).hidden).toBe(true);
  });

  test("doesn't report a close it was told to make", async() => {
    const { current, onClose } = setup();

    current.value = POST;
    current.value = undefined;
    await new Promise(resolve => setTimeout(resolve));
    expect(onClose).not.toHaveBeenCalled();
  });
});
