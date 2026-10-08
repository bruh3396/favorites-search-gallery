import { LightboxScreen, LightboxScreenClass } from "@/core/ui/lightbox/screen";
import { Mock, describe, expect, onTestFinished, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import LIGHTBOX_CSS from "@/core/ui/lightbox/lightbox.css?inline";
import { LightboxStageClass } from "@/core/ui/lightbox/stage";
import { MediaItem } from "@/core/domain/post/post";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css";

const POST: MediaItem = { id: "1", media: { kind: "image", locator: "images/1" } };

interface Setup {
  dialog: HTMLDialogElement;
  current: Signal<MediaItem | undefined>;
  onShowNext: Mock<() => void>;
  onShowPrevious: Mock<() => void>;
  onClose: Mock<() => void>;
}

function setup(): Setup {
  const current = new Signal<MediaItem | undefined>(undefined);
  const onShowNext = vi.fn<() => void>();
  const onShowPrevious = vi.fn<() => void>();
  const onClose = vi.fn<() => void>();
  const { result, dispose } = render(document, () => (
    <LightboxScreen
      current={current}
      neighbors={new Signal<readonly MediaItem[]>([])}
      resolvePreviewUrl={media => Promise.resolve(`https://preview/${media.locator}`)}
      resolveOriginalUrl={media => Promise.resolve(`https://original/${media.locator}`)}
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
  return { dialog: result as HTMLDialogElement, current, onShowNext, onShowPrevious, onClose };
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

  test("shows the open post on its stage", async() => {
    const { dialog, current } = setup();

    current.value = POST;
    await vi.waitFor(() => expect(dialog.querySelector<HTMLImageElement>(`.${LightboxStageClass.image}`)!.src).toBe("https://original/images/1"));
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

  test("stays open when its media is clicked", async() => {
    const { dialog, current, onClose } = setup();

    current.value = POST;
    await vi.waitFor(() => expect(dialog.querySelector(`.${LightboxStageClass.image}`)).not.toBeNull());
    dialog.querySelector<HTMLElement>(`.${LightboxStageClass.image}`)!.click();
    expect(onClose).not.toHaveBeenCalled();
  });

  test("doesn't report a close it was told to make", async() => {
    const { current, onClose } = setup();

    current.value = POST;
    current.value = undefined;
    await new Promise(resolve => setTimeout(resolve));
    expect(onClose).not.toHaveBeenCalled();
  });
});
