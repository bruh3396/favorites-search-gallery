import { describe, expect, onTestFinished, test, vi } from "vitest";
import { LightboxKeys } from "@/core/features/lightbox/ui/screen/keys";

type Action = ReturnType<typeof vi.fn<() => void>>;

interface Setup {
  dialog: HTMLDialogElement;
  keys: LightboxKeys;
  showNext: Action;
  showPrevious: Action;
  close: Action;
  toggleAutoplay: Action;
}

function setup(): Setup {
  const dialog = document.createElement("dialog");
  const showNext = vi.fn<() => void>();
  const showPrevious = vi.fn<() => void>();
  const close = vi.fn<() => void>();
  const toggleAutoplay = vi.fn<() => void>();
  const keys = new LightboxKeys({ dialog, showNext, showPrevious, close, toggleAutoplay });

  document.body.append(dialog);
  keys.start();
  onTestFinished(() => {
    keys.stop();
    dialog.remove();
  });
  return { dialog, keys, showNext, showPrevious, close, toggleAutoplay };
}

function pressKey(target: EventTarget, key: string): KeyboardEvent {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });

  target.dispatchEvent(event);
  return event;
}

describe("LightboxKeys", () => {
  test("steps with the arrow keys and A and D, closes with Backspace and Delete, and toggles autoplay with Space", () => {
    const { dialog, showNext, showPrevious, close, toggleAutoplay } = setup();

    ["ArrowRight", "d", "D", "ArrowLeft", "a", "A", "Backspace", "Delete", " "].forEach(key => pressKey(dialog, key));
    expect([showNext, showPrevious, close, toggleAutoplay].map(action => action.mock.calls.length)).toEqual([3, 3, 2, 1]);
  });

  test("hears keys pressed outside its dialog and takes them from the browser", () => {
    const { showNext } = setup();

    expect(pressKey(document.body, "ArrowRight").defaultPrevented).toBe(true);
    expect(showNext).toHaveBeenCalledOnce();
  });

  test("brings focus back to its dialog when it acts", () => {
    const { dialog } = setup();
    const focus = vi.spyOn(dialog, "focus");

    pressKey(document.body, "ArrowRight");
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  test("leaves keys it doesn't use to the browser", () => {
    const { dialog, showNext, showPrevious, close, toggleAutoplay } = setup();

    expect(pressKey(dialog, "x").defaultPrevented).toBe(false);
    expect([showNext, showPrevious, close, toggleAutoplay].map(action => action.mock.calls.length)).toEqual([0, 0, 0, 0]);
  });

  test("leaves keys typed into a field alone", () => {
    const { showNext } = setup();
    const field = document.createElement("input");

    document.body.append(field);
    onTestFinished(() => field.remove());
    expect(pressKey(field, "ArrowRight").defaultPrevented).toBe(false);
    expect(showNext).not.toHaveBeenCalled();
  });

  describe("stop", () => {
    test("stops hearing keys", () => {
      const { keys, showNext } = setup();

      keys.stop();
      pressKey(document.body, "ArrowRight");
      expect(showNext).not.toHaveBeenCalled();
    });
  });
});
