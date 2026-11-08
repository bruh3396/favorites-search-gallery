import { LIGHTBOX_ICON_PATHS, LightboxIcon } from "@/core/features/lightbox/overlay/lightbox_icon";
import { LightboxToolbar, LightboxToolbarClass } from "@/core/features/lightbox/overlay/lightbox_toolbar";
import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { CommandHandlers } from "@/core/ui/key_bindings/command_handlers";
import { LightboxCommand } from "@/core/features/lightbox/commands/lightbox_command";
import { Signal } from "@/core/utils/reactive/signal";
import TOOLBAR_CSS from "@/core/features/lightbox/overlay/lightbox_toolbar.css?inline";
import { expectClassesStyled } from "@/testing/css_utilities";

function setup(detailsOpen: Signal<boolean> | null = new Signal(false)): {
  root: HTMLElement;
  handlers: CommandHandlers<LightboxCommand>;
  isAutoplaying: Signal<boolean>;
  inFullscreen: Signal<boolean>;
} {
  const isAutoplaying = new Signal(false);
  const inFullscreen = new Signal(false);
  const handlers = {
    toggleDetails: vi.fn(),
    toggleAutoplay: vi.fn(),
    download: vi.fn(),
    toggleFullscreen: vi.fn(),
    openPostPage: vi.fn(),
    close: vi.fn()
  } as Partial<CommandHandlers<LightboxCommand>> as CommandHandlers<LightboxCommand>;
  const { result: root } = render(document, () => (
    <LightboxToolbar
      isAutoplaying={isAutoplaying}
      inFullscreen={inFullscreen}
      detailsOpen={detailsOpen ?? undefined}
      handlers={handlers}
    />
  ));
  return { root, handlers, isAutoplaying, inFullscreen };
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

  test.each<[string, Signal<boolean> | null, string[]]>([
    ["with details", new Signal(false), ["Autoplay", "Details", "Open Post Page", "Fullscreen", "Close"]],
    ["without details", null, ["Autoplay", "Open Post Page", "Fullscreen", "Close"]]
  ])("orders the shown buttons %s", (_case, detailsOpen, expected) => {
    const { root } = setup(detailsOpen);
    const shownButtons = [...root.querySelectorAll("button")].filter(button => button.closest("[hidden]") === null);

    expect(shownButtons.map(button => button.getAttribute("aria-label"))).toEqual(expected);
  });

  test("hides Download", () => {
    const { root } = setup(null);

    expect(root.querySelector("button[aria-label=Download]")!.closest("[hidden]")).not.toBeNull();
  });

  test.each<[string, LightboxCommand]>([
    ["Details", "toggleDetails"],
    ["Autoplay", "toggleAutoplay"],
    ["Fullscreen", "toggleFullscreen"],
    ["Open Post Page", "openPostPage"],
    ["Close", "close"]
  ])("runs %s's command when clicked", (label, lightboxCommand) => {
    const { root, handlers } = setup();

    findButton(root, label).click();
    expect(handlers[lightboxCommand]).toHaveBeenCalledOnce();
  });

  test("renders its leading slot", () => {
    const { result: root } = render(document, () => (
      <LightboxToolbar
        isAutoplaying={new Signal(false)}
        inFullscreen={new Signal(false)}
        leadingChild={<button type="button" aria-label="Favorite" />}
        handlers={{} as CommandHandlers<LightboxCommand>}
      />
    ));

    expect(findButton(root, "Favorite")).not.toBeNull();
  });

  test("shows details as pressed while the details panel is open", () => {
    const detailsOpen = new Signal(false);
    const button = findButton(setup(detailsOpen).root, "Details");

    expect(button.getAttribute("aria-pressed")).toBe("false");
    detailsOpen.value = true;
    expect(button.getAttribute("aria-pressed")).toBe("true");
  });

  test("leaves out the details button without a details panel", () => {
    expect(findButton(setup(null).root, "Details")).toBeNull();
  });

  test("shows autoplay as a pressed pause button while autoplaying", () => {
    const { root, isAutoplaying } = setup();
    const button = findButton(root, "Autoplay");

    expectState(button, { pressed: false, icon: "play" });
    isAutoplaying.value = true;
    expectState(button, { pressed: true, icon: "pause" });
  });

  test("shows fullscreen as a pressed exit button while in fullscreen", () => {
    const { root, inFullscreen } = setup();
    const button = findButton(root, "Fullscreen");

    expectState(button, { pressed: false, icon: "fullscreen" });
    inFullscreen.value = true;
    expectState(button, { pressed: true, icon: "exitFullscreen" });
  });
});
