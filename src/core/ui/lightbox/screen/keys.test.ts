import { describe, expect, onTestFinished, test, vi } from "vitest";
import { LightboxKeys } from "@/core/ui/lightbox/screen/keys";

type Action = ReturnType<typeof vi.fn<() => void>>;

interface Setup {
  dialog: HTMLDialogElement;
  keys: LightboxKeys;
  onShowNext: Action;
  onShowPrevious: Action;
  onClose: Action;
  onToggleAutoplay: Action;
}

function setup(): Setup {
  const dialog = document.createElement("dialog");
  const onShowNext = vi.fn<() => void>();
  const onShowPrevious = vi.fn<() => void>();
  const onClose = vi.fn<() => void>();
  const onToggleAutoplay = vi.fn<() => void>();
  const keys = new LightboxKeys({ dialog, onShowNext, onShowPrevious, onClose, onToggleAutoplay });

  document.body.append(dialog);
  keys.listen();
  onTestFinished(() => {
    keys.stop();
    dialog.remove();
  });
  return { dialog, keys, onShowNext, onShowPrevious, onClose, onToggleAutoplay };
}

function pressKey(target: EventTarget, key: string): KeyboardEvent {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });

  target.dispatchEvent(event);
  return event;
}

describe("LightboxKeys", () => {
  test("steps with the arrow keys and A and D, closes with Backspace and Delete, and toggles autoplay with Space", () => {
    const { dialog, onShowNext, onShowPrevious, onClose, onToggleAutoplay } = setup();

    ["ArrowRight", "d", "D", "ArrowLeft", "a", "A", "Backspace", "Delete", " "].forEach(key => pressKey(dialog, key));
    expect([onShowNext, onShowPrevious, onClose, onToggleAutoplay].map(action => action.mock.calls.length)).toEqual([3, 3, 2, 1]);
  });

  test("hears keys pressed outside its dialog and takes them from the browser", () => {
    const { onShowNext } = setup();

    expect(pressKey(document.body, "ArrowRight").defaultPrevented).toBe(true);
    expect(onShowNext).toHaveBeenCalledOnce();
  });

  test("brings focus back to its dialog when it acts", () => {
    const { dialog } = setup();
    const focus = vi.spyOn(dialog, "focus");

    pressKey(document.body, "ArrowRight");
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  test("leaves keys it doesn't use to the browser", () => {
    const { dialog, onShowNext, onShowPrevious, onClose, onToggleAutoplay } = setup();

    expect(pressKey(dialog, "x").defaultPrevented).toBe(false);
    expect([onShowNext, onShowPrevious, onClose, onToggleAutoplay].map(action => action.mock.calls.length)).toEqual([0, 0, 0, 0]);
  });

  test("leaves keys typed into a field alone", () => {
    const { onShowNext } = setup();
    const field = document.createElement("input");

    document.body.append(field);
    onTestFinished(() => field.remove());
    expect(pressKey(field, "ArrowRight").defaultPrevented).toBe(false);
    expect(onShowNext).not.toHaveBeenCalled();
  });

  describe("stop", () => {
    test("stops hearing keys", () => {
      const { keys, onShowNext } = setup();

      keys.stop();
      pressKey(document.body, "ArrowRight");
      expect(onShowNext).not.toHaveBeenCalled();
    });
  });
});
