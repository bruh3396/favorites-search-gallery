import { SettingRow, SettingRowClass, SettingRowProps } from "@/core/ui/components/setting_row/setting_row";
import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import SETTING_ROW_CSS from "@/core/ui/components/setting_row/setting_row.css?inline";
import { expectClassesStyled } from "@/testing/css_utilities";

interface Setup {
  element: HTMLElement;
  control: HTMLElement;
}

function setup(partialSettingRowProps: Partial<SettingRowProps> = {}): Setup {
  const control = partialSettingRowProps.control ?? document.createElement("button");
  const { result: element } = render(document, () => <SettingRow label="Columns" {...partialSettingRowProps} control={control} />);
  return { element, control };
}

function readTexts(elements: readonly Element[] | null): string[] {
  return (elements ?? []).map(element => element.textContent ?? "");
}

describe("SettingRow", () => {
  test("shows the label, then the control", () => {
    const { element, control } = setup();

    expect(element.textContent).toBe("Columns");
    expect(element.lastElementChild).toBe(control);
  });

  test("names the control by its label, by reference rather than id", () => {
    const { element, control } = setup();

    expect(readTexts(control.ariaLabelledByElements)).toEqual(["Columns"]);
    expect(element.querySelector("[id]")).toBeNull();
  });

  test("defaults to medium unless given a size", () => {
    expect(setup().element.dataset.size).toBe("medium");
    expect(setup({ controlSize: "small" }).element.dataset.size).toBe("small");
  });

  test("activates on a click outside its control", () => {
    let activations = 0;
    const { element } = setup({ onActivate: () => {
      activations += 1;
    } });

    element.querySelector<HTMLElement>(`.${SettingRowClass.label}`)?.click();
    expect(activations).toBe(1);
  });

  test("leaves a click on its control to the control", () => {
    let activations = 0;
    const { control } = setup({ onActivate: () => {
      activations += 1;
    } });

    control.click();
    expect(activations).toBe(0);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(SettingRowClass, SETTING_ROW_CSS);
  });
});
