import { Switch, SwitchClass, SwitchProps } from "@/core/ui/components/switch/switch";
import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import SWITCH_CSS from "@/core/ui/components/switch/switch.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css";

interface Setup {
  element: HTMLButtonElement;
  dispose: () => void;
  value: Signal<boolean>;
  disabled: Signal<boolean>;
  onValueChange: (next: boolean) => void;
}

function setup(props: Partial<SwitchProps> = {}): Setup {
  const value = new Signal(false);
  const disabled = new Signal(false);
  const onValueChange = vi.fn<(next: boolean) => void>();
  const { result, dispose } = render(document, () => <Switch value={value} disabled={disabled} onValueChange={onValueChange} {...props} />);
  return { element: result as HTMLButtonElement, dispose, value, disabled, onValueChange };
}

describe("Switch", () => {
  test("is a switch button showing its value", () => {
    const { element } = setup();

    expect(element.getAttribute("role")).toBe("switch");
    expect(element.type).toBe("button");
    expect(element.getAttribute("aria-checked")).toBe("false");
  });

  test("is medium unless told otherwise", () => {
    expect(setup().element.dataset.size).toBe("medium");
    expect(setup({ size: "small" }).element.dataset.size).toBe("small");
  });

  test("reports the flipped value on click without changing itself", () => {
    const { element, onValueChange } = setup();

    element.click();
    expect(onValueChange).toHaveBeenLastCalledWith(true);
    expect(element.getAttribute("aria-checked")).toBe("false");
  });

  test("flips from its current value", () => {
    const { element, value, onValueChange } = setup();

    value.value = true;
    element.click();
    expect(onValueChange).toHaveBeenLastCalledWith(false);
  });

  test("follows its value", () => {
    const { element, value } = setup();

    value.value = true;
    expect(element.getAttribute("aria-checked")).toBe("true");
    value.value = false;
    expect(element.getAttribute("aria-checked")).toBe("false");
  });

  test("ignores clicks while disabled", () => {
    const { element, disabled, onValueChange } = setup();

    disabled.value = true;
    element.click();
    expect(element.disabled).toBe(true);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  test("is enabled unless given a disabled state", () => {
    const { result } = render(document, () => <Switch value={new Signal(false)} onValueChange={vi.fn()} />);

    expect((result as HTMLButtonElement).disabled).toBe(false);
  });

  test("stops following its value once disposed", () => {
    const { element, value, dispose } = setup();

    dispose();
    value.value = true;
    expect(element.getAttribute("aria-checked")).toBe("false");
  });

  test("styles every class it sets", () => {
    expectClassesStyled(SwitchClass, SWITCH_CSS);
  });
});
