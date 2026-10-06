import { LightboxScreen, LightboxScreenClass } from "@/core/features/lightbox/ui/screen/screen";
import { Mock, describe, expect, onTestFinished, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { MediaItem } from "@/core/domain/post/post";
import { Signal } from "@/core/utils/reactive/signal";

const POST: MediaItem = { id: "1", media: { kind: "image", locator: "images/1" } };

interface Setup {
  dialog: HTMLDialogElement;
  current: Signal<MediaItem | undefined>;
  onClose: Mock<() => void>;
}

function setup(): Setup {
  const current = new Signal<MediaItem | undefined>(undefined);
  const onClose = vi.fn<() => void>();
  const { result, dispose } = render(document, () => <LightboxScreen current={current} onClose={onClose} />);

  document.body.append(result);
  onTestFinished(() => {
    dispose();
    result.remove();
  });
  return { dialog: result as HTMLDialogElement, current, onClose };
}

describe("LightboxScreen", () => {
  test("draws a labelled dialog that stays closed until a post is open", () => {
    const { dialog } = setup();

    expect([dialog.tagName, dialog.className, dialog.getAttribute("aria-label"), dialog.open]).toEqual(["DIALOG", LightboxScreenClass.root, "Gallery", false]);
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

  test("doesn't report a close it was told to make", async() => {
    const { current, onClose } = setup();

    current.value = POST;
    current.value = undefined;
    await new Promise(resolve => setTimeout(resolve));
    expect(onClose).not.toHaveBeenCalled();
  });
});
