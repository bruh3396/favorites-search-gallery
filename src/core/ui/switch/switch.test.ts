import { Switch, SwitchClass, createSwitch } from "@/core/ui/switch/switch";
import { describe, expect, test, vi } from "vitest";
import SWITCH_CSS from "@/core/ui/switch/switch.css?inline";
import { expectClassesStyled } from "@/testing/css";

function setup(): Switch & { onValueChange: (next: boolean) => void } {
  const onValueChange = vi.fn();
  return { ...createSwitch(document, { onValueChange }), onValueChange };
}

describe("createSwitch", () => {
  test("is an unchecked switch button", () => {
    const { element } = setup();

    expect(element.getAttribute("role")).toBe("switch");
    expect(element.type).toBe("button");
    expect(element.getAttribute("aria-checked")).toBe("false");
  });

  test("is medium unless told otherwise", () => {
    expect(setup().element.dataset.size).toBe("medium");
    expect(createSwitch(document, { onValueChange: vi.fn(), size: "small" }).element.dataset.size).toBe("small");
  });

  test("reports the flipped value on click without changing itself", () => {
    const { element, onValueChange } = setup();

    element.click();
    expect(onValueChange).toHaveBeenLastCalledWith(true);
    expect(element.getAttribute("aria-checked")).toBe("false");
  });

  test("flips from the value it was last told", () => {
    const { element, onValueChange, setValue } = setup();

    setValue(true);
    element.click();
    expect(onValueChange).toHaveBeenLastCalledWith(false);
  });

  test("shows what it is told", () => {
    const { element, setValue } = setup();

    setValue(true);
    expect(element.getAttribute("aria-checked")).toBe("true");
    setValue(false);
    expect(element.getAttribute("aria-checked")).toBe("false");
  });

  test("ignores clicks while disabled", () => {
    const { element, onValueChange, setDisabled } = setup();

    setDisabled(true);
    element.click();
    expect(element.disabled).toBe(true);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  test("styles every class it sets", () => {
    expectClassesStyled(SwitchClass, SWITCH_CSS);
  });
});
