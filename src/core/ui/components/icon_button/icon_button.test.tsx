import { IconButton, IconButtonClass, IconButtonProps } from "@/core/ui/components/icon_button/icon_button";
import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import ICON_BUTTON_CSS from "@/core/ui/components/icon_button/icon_button.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css_utilities";

function setup(partialIconButtonProps: Partial<IconButtonProps> = {}): HTMLButtonElement {
  return render(document, () => <IconButton icon="scan" label="Zen" onClick={() => undefined} {...partialIconButtonProps} />).result as HTMLButtonElement;
}

describe("IconButton", () => {
  test("names itself with its label", () => {
    const label = new Signal("Show tabs");
    const element = setup({ label });

    label.value = "Show tabs (3 open)";
    expect([element.type, element.getAttribute("aria-label")]).toEqual(["button", "Show tabs (3 open)"]);
  });

  test("shows its label as a tooltip", () => {
    expect(setup({ label: "Zen" }).title).toBe("Zen");
  });

  test("submits its form when it is a submit button", () => {
    expect(setup({ type: "submit" }).type).toBe("submit");
  });

  test("disables itself while told to", () => {
    const disabled = new Signal(true);
    const element = setup({ disabled });
    const wasDisabled = element.disabled;

    disabled.value = false;
    expect([wasDisabled, element.disabled]).toEqual([true, false]);
  });

  test("keeps the classes it is given beside its own", () => {
    expect(setup({ className: "fsg-Host-action" }).className).toBe(`${IconButtonClass.root} fsg-Host-action`);
  });

  test("defaults to the medium size", () => {
    expect([setup().dataset.size, setup({ size: "small" }).dataset.size]).toEqual(["medium", "small"]);
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
