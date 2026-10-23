import { LIGHTBOX_ICON_PATHS, LightboxIcon } from "@/core/features/lightbox/ui/chrome/icon";
import { LightboxCommand, LightboxCommandHandlers } from "@/core/features/lightbox/input/commands";
import { LightboxToolbar, LightboxToolbarClass } from "@/core/features/lightbox/ui/chrome/toolbar";
import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { Signal } from "@/core/utils/reactive/signal";
import TOOLBAR_CSS from "@/core/features/lightbox/ui/chrome/toolbar.css?inline";
import { expectClassesStyled } from "@/testing/css";

function setup(): {
  root: HTMLElement;
  handlers: LightboxCommandHandlers;
  isZoomed: Signal<boolean>;
  canZoom: Signal<boolean>;
  isAutoplaying: Signal<boolean>;
  inFullscreen: Signal<boolean>;
} {
  const isZoomed = new Signal(false);
  const canZoom = new Signal(true);
  const isAutoplaying = new Signal(false);
  const inFullscreen = new Signal(false);
  const handlers = {
    toggleAutoplay: vi.fn(),
    download: vi.fn(),
    toggleZoom: vi.fn(),
    toggleFullscreen: vi.fn(),
    openPostPage: vi.fn(),
    close: vi.fn()
  } as Partial<LightboxCommandHandlers> as LightboxCommandHandlers;
  const { result: root } = render(document, () => (
    <LightboxToolbar
      zoom={{ isZoomed, canZoom }}
      isAutoplaying={isAutoplaying}
      inFullscreen={inFullscreen}
      handlers={handlers}
      keymap={{ " ": "toggleAutoplay", Escape: "dismiss", Backspace: "close" }}
    />
  ));
  return { root, handlers, isZoomed, canZoom, isAutoplaying, inFullscreen };
}

function findButton(root: HTMLElement, label: string): HTMLButtonElement {
  return root.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)!;
}

function readState(button: HTMLButtonElement): [string | null, string | null | undefined] {
  return [button.getAttribute("aria-pressed"), button.querySelector("path")?.getAttribute("d")];
}

interface ButtonState {
  readonly pressed: boolean;
  readonly icon: LightboxIcon;
}

function expectState(button: HTMLButtonElement, { pressed, icon }: ButtonState): void {
  expect(readState(button)).toEqual([String(pressed), LIGHTBOX_ICON_PATHS[icon]]);
}

describe("LightboxToolbar", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(LightboxToolbarClass, TOOLBAR_CSS);
  });

  test.each<[string, LightboxCommand]>([
    ["Autoplay", "toggleAutoplay"],
    ["Download", "download"],
    ["Zoom", "toggleZoom"],
    ["Fullscreen", "toggleFullscreen"],
    ["Open post page", "openPostPage"],
    ["Close", "close"]
  ])("runs %s's command when clicked", (label, command) => {
    const { root, handlers } = setup();

    findButton(root, label).click();
    expect(handlers[command]).toHaveBeenCalledOnce();
  });

  test.each([
    ["Autoplay", "Autoplay (Space)"],
    ["Close", "Close (Esc)"],
    ["Download", "Download"]
  ])("titles %s with its key", (label, title) => {
    const { root } = setup();

    expect(findButton(root, label).title).toBe(title);
  });

  test("shows autoplay as a pressed pause button while autoplaying", () => {
    const { root, isAutoplaying } = setup();
    const button = findButton(root, "Autoplay");

    expectState(button, { pressed: false, icon: "play" });
    isAutoplaying.value = true;
    expectState(button, { pressed: true, icon: "pause" });
  });

  test("shows zoom as a pressed zoom-out button while zoomed", () => {
    const { root, isZoomed } = setup();
    const button = findButton(root, "Zoom");

    expectState(button, { pressed: false, icon: "zoomIn" });
    isZoomed.value = true;
    expectState(button, { pressed: true, icon: "zoomOut" });
  });

  test("disables zoom while it can't zoom", () => {
    const { root, canZoom } = setup();

    canZoom.value = false;
    expect(findButton(root, "Zoom").disabled).toBe(true);
  });

  test("shows fullscreen as a pressed exit button while in fullscreen", () => {
    const { root, inFullscreen } = setup();
    const button = findButton(root, "Fullscreen");

    expectState(button, { pressed: false, icon: "fullscreen" });
    inFullscreen.value = true;
    expectState(button, { pressed: true, icon: "exitFullscreen" });
  });
});
