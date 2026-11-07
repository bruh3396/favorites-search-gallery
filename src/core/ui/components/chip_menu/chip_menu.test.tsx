import { ChipMenu, ChipMenuClass } from "@/core/ui/components/chip_menu/chip_menu";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import CHIP_MENU_CSS from "@/core/ui/components/chip_menu/chip_menu.css?inline";
import { OptionMenuClass } from "@/core/ui/components/option_menu/option_menu";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css_utilities";

function setup(onChoose: () => void = vi.fn()): HTMLElement {
  const { result, dispose } = render(document, () => (
    <ChipMenu
      label="Status"
      value="All"
      highlighted={new Signal(false)}
      optionMenuItems={[{ label: "Removed", selected: new Signal(true), onChoose }]}
    />
  ));
  const container = document.createElement("div");

  container.append(result);
  document.body.append(container);
  onTestFinished(() => {
    dispose();
    container.remove();
  });
  return result;
}

describe("ChipMenu", () => {
  test("shows its label and value on a closed chip", () => {
    const chip = setup();

    expect(chip.textContent).toBe("StatusAll");
    expect(chip.getAttribute("aria-expanded")).toBe("false");
  });

  test("opens its options when clicked", () => {
    const chip = setup();

    chip.click();
    expect(document.querySelector(`.${OptionMenuClass.option}`)?.textContent).toBe("Removed");
  });

  test("reports a chosen option", () => {
    const onChoose = vi.fn();
    const chip = setup(onChoose);

    chip.click();
    document.querySelector<HTMLElement>(`.${OptionMenuClass.option}`)?.click();
    expect(onChoose).toHaveBeenCalledOnce();
  });

  test("styles every class it sets", () => {
    expectClassesStyled(ChipMenuClass, CHIP_MENU_CSS);
  });
});
