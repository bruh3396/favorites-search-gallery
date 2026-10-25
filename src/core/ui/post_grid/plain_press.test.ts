import { describe, expect, test, vi } from "vitest";
import { PlainPress } from "@/core/ui/post_grid/plain_press";

function setup(handled = true): { onPlainClick: () => boolean; plainPress: PlainPress } {
  const onPlainClick = vi.fn(() => handled);
  return { onPlainClick, plainPress: new PlainPress(onPlainClick) };
}

function createPress(init: PointerEventInit = {}): PointerEvent {
  return new PointerEvent("pointerdown", { pointerType: "mouse", button: 0, cancelable: true, ...init });
}

describe("PlainPress", () => {
  describe("press", () => {
    test("reports a plain mouse press and blocks its default once handled", () => {
      const { onPlainClick, plainPress } = setup();
      const event = createPress();

      plainPress.press(event);
      expect(onPlainClick).toHaveBeenCalledOnce();
      expect(event.defaultPrevented).toBe(true);
    });

    test("leaves the default of an unhandled press alone", () => {
      const { plainPress } = setup(false);
      const event = createPress();

      plainPress.press(event);
      expect(event.defaultPrevented).toBe(false);
    });

    test("ignores touch, pen, non-primary, and modified presses", () => {
      const { onPlainClick, plainPress } = setup();

      plainPress.press(createPress({ pointerType: "touch" }));
      plainPress.press(createPress({ pointerType: "pen" }));
      plainPress.press(createPress({ button: 2 }));
      plainPress.press(createPress({ shiftKey: true }));
      plainPress.press(createPress({ altKey: true }));
      plainPress.press(createPress({ ctrlKey: true }));
      plainPress.press(createPress({ metaKey: true }));
      expect(onPlainClick).not.toHaveBeenCalled();
    });
  });

  describe("release", () => {
    test("reuses the press's answer instead of reporting again", () => {
      const { onPlainClick, plainPress } = setup();

      plainPress.press(createPress());
      expect(plainPress.release()).toBe(true);
      expect(onPlainClick).toHaveBeenCalledOnce();
    });

    test("reports a click that had no mouse press", () => {
      const { onPlainClick, plainPress } = setup();

      plainPress.press(createPress({ pointerType: "touch" }));
      expect(plainPress.release()).toBe(true);
      expect(onPlainClick).toHaveBeenCalledOnce();
    });

    test("reports again on a later click without a press", () => {
      const { onPlainClick, plainPress } = setup();

      plainPress.press(createPress());
      plainPress.release();
      plainPress.release();
      expect(onPlainClick).toHaveBeenCalledTimes(2);
    });
  });
});
