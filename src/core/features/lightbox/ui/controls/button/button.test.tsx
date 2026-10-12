import { LightboxButton, LightboxButtonClass, LightboxButtonProps } from "@/core/features/lightbox/ui/controls/button/button";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import BUTTON_CSS from "@/core/features/lightbox/ui/controls/button/button.css?inline";
import { LIGHTBOX_ICON_PATHS } from "@/core/features/lightbox/ui/controls/button/icons";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css";

function setup(props: Partial<LightboxButtonProps> = {}): { button: HTMLButtonElement; onClick: () => void } {
  const onClick = vi.fn<() => void>();
  const { result, dispose } = render(document, () => <LightboxButton icon="close" label="Close" onClick={onClick} {...props} />);

  onTestFinished(dispose);
  return { button: result as HTMLButtonElement, onClick };
}

function readIconPath(button: HTMLButtonElement): string | null {
  return button.querySelector("path")!.getAttribute("d");
}

describe("LightboxButton", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(LightboxButtonClass, BUTTON_CSS);
  });

  test("draws a labelled button with its icon", () => {
    const { button } = setup();

    expect([button.type, button.getAttribute("aria-label"), button.title, button.dataset.icon, readIconPath(button)])
      .toEqual(["button", "Close", "Close", "close", LIGHTBOX_ICON_PATHS.close]);
  });

  test("redraws its icon when the icon changes", () => {
    const icon = new Signal<"fullscreen" | "exitFullscreen">("fullscreen");
    const { button } = setup({ icon });

    icon.value = "exitFullscreen";
    expect([button.dataset.icon, readIconPath(button)]).toEqual(["exitFullscreen", LIGHTBOX_ICON_PATHS.exitFullscreen]);
  });

  test("reports whether it is pressed only when given a pressed state", () => {
    const pressed = new Signal(false);
    const { button: toggle } = setup({ pressed });
    const { button: plain } = setup();

    pressed.value = true;
    expect([toggle.getAttribute("aria-pressed"), plain.hasAttribute("aria-pressed")]).toEqual(["true", false]);
  });

  test("calls back when clicked", () => {
    const { button, onClick } = setup();

    button.click();
    expect(onClick).toHaveBeenCalledOnce();
  });
});
