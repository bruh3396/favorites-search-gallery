import { LIGHTBOX_ICON_PATHS, LightboxIcon } from "@/core/features/lightbox/overlay/lightbox_icon";
import { LightboxButton, LightboxButtonClass } from "@/core/features/lightbox/overlay/lightbox_button";
import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import BUTTON_CSS from "@/core/features/lightbox/overlay/lightbox_button.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css_utilities";

function readIconPath(button: HTMLElement): string | null | undefined {
  return button.querySelector("path")?.getAttribute("d");
}

describe("LightboxButton", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(LightboxButtonClass, BUTTON_CSS);
  });

  test("labels itself and draws its icon", () => {
    const { result: button } = render(document, () => <LightboxButton icon="download" label="Download" onClick={vi.fn()} />);

    expect([button.getAttribute("aria-label"), button.title]).toEqual(["Download", "Download"]);
    expect(readIconPath(button)).toBe(LIGHTBOX_ICON_PATHS.download);
    expect(button.hasAttribute("aria-pressed")).toBe(false);
    expect((button as HTMLButtonElement).disabled).toBe(false);
  });

  test("names its shortcut in its title and to assistive technology", () => {
    const { result: button } = render(document, () => (
      <LightboxButton icon="play" label="Autoplay" lightboxShortcut={{ text: "Space", ariaName: "Space" }} onClick={vi.fn()} />
    ));

    expect([button.title, button.getAttribute("aria-keyshortcuts")]).toEqual(["Autoplay (Space)", "Space"]);
  });

  test("swaps its icon when the icon changes", () => {
    const icon = new Signal<LightboxIcon>("play");
    const { result: button } = render(document, () => <LightboxButton icon={icon} label="Autoplay" onClick={vi.fn()} />);

    icon.value = "pause";
    expect(readIconPath(button)).toBe(LIGHTBOX_ICON_PATHS.pause);
  });

  test("reports whether it is pressed", () => {
    const pressed = new Signal(false);
    const { result: button } = render(document, () => <LightboxButton icon="play" label="Autoplay" pressed={pressed} onClick={vi.fn()} />);

    expect(button.getAttribute("aria-pressed")).toBe("false");
    pressed.value = true;
    expect(button.getAttribute("aria-pressed")).toBe("true");
  });

  test("disables itself while disabled", () => {
    const disabled = new Signal(true);
    const { result: button } = render(document, () => <LightboxButton icon="download" label="Download" disabled={disabled} onClick={vi.fn()} />);

    expect((button as HTMLButtonElement).disabled).toBe(true);
    disabled.value = false;
    expect((button as HTMLButtonElement).disabled).toBe(false);
  });

  test("runs its action when clicked", () => {
    const onClick = vi.fn();
    const { result: button } = render(document, () => <LightboxButton icon="close" label="Close" onClick={onClick} />);

    button.click();
    expect(onClick).toHaveBeenCalledOnce();
  });
});
