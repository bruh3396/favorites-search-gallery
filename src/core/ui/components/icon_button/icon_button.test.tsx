import { IconButton, IconButtonClass, IconButtonProps } from "@/core/ui/components/icon_button/icon_button";
import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import ICON_BUTTON_CSS from "@/core/ui/components/icon_button/icon_button.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css";

function setup(props: Partial<IconButtonProps> = {}): HTMLButtonElement {
  return render(document, () => <IconButton icon="scan" label="Zen" onClick={() => undefined} {...props} />).result as HTMLButtonElement;
}

describe("IconButton", () => {
  test("names itself with its label", () => {
    const label = new Signal("Show tabs");
    const element = setup({ label });

    label.value = "Show tabs (3 open)";
    expect([element.type, element.getAttribute("aria-label")]).toEqual(["button", "Show tabs (3 open)"]);
  });

  test("calls back when clicked", () => {
    const onClick = vi.fn<() => void>();

    setup({ onClick }).click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  test("reports whether it is pressed while it toggles", () => {
    const pressed = new Signal(false);
    const element = setup({ pressed });
    const before = element.getAttribute("aria-pressed");

    pressed.value = true;
    expect([before, element.getAttribute("aria-pressed")]).toEqual(["false", "true"]);
  });

  test("leaves out the pressed state when it does not toggle", () => {
    expect(setup().hasAttribute("aria-pressed")).toBe(false);
  });

  test("shows its children beside the icon", () => {
    const badge = document.createElement("span");

    expect(setup({ children: badge }).contains(badge)).toBe(true);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(IconButtonClass, ICON_BUTTON_CSS);
  });
});
