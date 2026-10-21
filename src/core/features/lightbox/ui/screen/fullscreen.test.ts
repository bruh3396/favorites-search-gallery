import { describe, expect, test, vi } from "vitest";
import { LightboxFullscreen } from "@/core/features/lightbox/ui/screen/fullscreen";

interface Setup {
  element: HTMLElement;
  toggle: LightboxFullscreen;
  requestFullscreen: ReturnType<typeof vi.fn<() => Promise<void>>>;
  exitFullscreen: ReturnType<typeof vi.fn<() => Promise<void>>>;
  enterFullscreen: () => void;
}

function setup(): Setup {
  const host = document.createElement("div");
  const shadowRoot = host.attachShadow({ mode: "open" });
  const element = document.createElement("div");
  let fullscreenElement: Element | null = null;
  const requestFullscreen = vi.fn<() => Promise<void>>(() => Promise.resolve());
  const exitFullscreen = vi.fn<() => Promise<void>>(() => Promise.resolve());

  shadowRoot.append(element);
  Object.defineProperty(shadowRoot, "fullscreenElement", { get: () => fullscreenElement });
  Object.defineProperty(element.ownerDocument, "fullscreenElement", { configurable: true, get: () => (fullscreenElement === null ? null : host) });
  Object.defineProperty(element.ownerDocument, "exitFullscreen", { configurable: true, value: exitFullscreen });
  Object.defineProperty(element, "requestFullscreen", { value: requestFullscreen });
  const toggle = new LightboxFullscreen(element);
  const enterFullscreen = (): void => {
    fullscreenElement = element;
    element.dispatchEvent(new Event("fullscreenchange"));
  };
  return { element, toggle, requestFullscreen, exitFullscreen, enterFullscreen };
}

describe("LightboxFullscreen", () => {
  test("follows whether its element in a shadow root is fullscreen", () => {
    const { toggle, enterFullscreen } = setup();

    expect(toggle.isFullscreen.value).toBe(false);
    enterFullscreen();
    expect(toggle.isFullscreen.value).toBe(true);
  });

  describe("toggle", () => {
    test("asks for fullscreen when it isn't, and leaves it when it is", () => {
      const { toggle, requestFullscreen, exitFullscreen, enterFullscreen } = setup();

      toggle.toggle();
      enterFullscreen();
      toggle.toggle();
      expect([requestFullscreen.mock.calls.length, exitFullscreen.mock.calls.length]).toEqual([1, 1]);
    });
  });

  describe("start", () => {
    test("leaves fullscreen alone", () => {
      const { toggle, requestFullscreen, exitFullscreen, enterFullscreen } = setup();

      toggle.start();
      enterFullscreen();
      toggle.start();
      expect([requestFullscreen.mock.calls.length, exitFullscreen.mock.calls.length]).toEqual([0, 0]);
    });
  });

  describe("stop", () => {
    test("leaves fullscreen", () => {
      const { toggle, exitFullscreen, enterFullscreen } = setup();

      enterFullscreen();
      toggle.stop();
      expect(exitFullscreen).toHaveBeenCalledOnce();
    });
  });

  describe("exit", () => {
    test("leaves fullscreen only when its element holds it", () => {
      const { toggle, exitFullscreen, enterFullscreen } = setup();

      toggle.exit();
      expect(exitFullscreen).not.toHaveBeenCalled();
      enterFullscreen();
      toggle.exit();
      expect(exitFullscreen).toHaveBeenCalledOnce();
    });
  });
});
