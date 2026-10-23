import { describe, expect, test, vi } from "vitest";
import { LightboxCommandHandlers } from "@/core/features/lightbox/input/commands";
import { createLightboxKeyListener } from "@/core/features/lightbox/input/key_listener";

function setup(): { showNext: () => void; listener: (event: KeyboardEvent) => void } {
  const showNext = vi.fn();
  const handlers = { showNext } as Partial<LightboxCommandHandlers> as LightboxCommandHandlers;
  return { showNext, listener: createLightboxKeyListener({ ArrowRight: "showNext" }, handlers) };
}

describe("createLightboxKeyListener", () => {
  test("runs the command mapped to the key and claims the event", () => {
    const { showNext, listener } = setup();
    const event = new KeyboardEvent("keydown", { key: "ArrowRight", cancelable: true });

    listener(event);
    expect(showNext).toHaveBeenCalledOnce();
    expect(event.defaultPrevented).toBe(true);
  });

  test("ignores an unmapped key", () => {
    const { showNext, listener } = setup();
    const event = new KeyboardEvent("keydown", { key: "x", cancelable: true });

    listener(event);
    expect(showNext).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  test.each(["ctrlKey", "metaKey", "altKey"] as const)("ignores a key pressed with %s", modifier => {
    const { showNext, listener } = setup();

    listener(new KeyboardEvent("keydown", { key: "ArrowRight", [modifier]: true }));
    expect(showNext).not.toHaveBeenCalled();
  });

  test("focuses the element it listens on", () => {
    const { listener } = setup();
    const element = document.createElement("div");

    element.tabIndex = -1;
    document.body.append(element);
    element.addEventListener("keydown", listener);
    element.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    expect(document.activeElement).toBe(element);
    element.remove();
  });
});
