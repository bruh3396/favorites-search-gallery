import { Button, ButtonClass, ButtonProps } from "@/core/ui/components/button/button";
import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import BUTTON_CSS from "@/core/ui/components/button/button.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css_utilities";

function setup(partialButtonProps: Partial<ButtonProps> = {}): HTMLButtonElement {
  return render(document, () => <Button label="Start" onClick={() => undefined} {...partialButtonProps} />).result as HTMLButtonElement;
}

describe("Button", () => {
  test("shows its label as its name", () => {
    const label = new Signal("Run");
    const element = setup({ label });
    const before = element.textContent;

    label.value = "Cancel";
    expect([before, element.textContent]).toEqual(["Run", "Cancel"]);
  });

  test("submits its form only when it is a submit button", () => {
    expect([setup().type, setup({ type: "submit" }).type]).toEqual(["button", "submit"]);
  });

  test("disables itself while told to", () => {
    const disabled = new Signal(true);
    const element = setup({ disabled });
    const wasDisabled = element.disabled;

    disabled.value = false;
    expect([wasDisabled, element.disabled]).toEqual([true, false]);
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

  test("keeps the classes it is given beside its own", () => {
    expect(setup({ className: "fsg-Host-action" }).className).toBe(`${ButtonClass.root} fsg-Host-action`);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(ButtonClass, BUTTON_CSS);
  });
});
