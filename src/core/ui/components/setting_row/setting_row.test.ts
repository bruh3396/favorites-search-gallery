import { SettingRow, SettingRowClass, SettingRowOptions, createSettingRow } from "@/core/ui/components/setting_row/setting_row";
import { describe, expect, test } from "vitest";
import SETTING_ROW_CSS from "@/core/ui/components/setting_row/setting_row.css?inline";
import { expectClassesStyled } from "@/testing/css";

function setup(options: Partial<SettingRowOptions> = {}): SettingRow & { control: HTMLElement } {
  const control = options.control ?? document.createElement("button");
  return { ...createSettingRow(document, { label: "Columns", ...options, control }), control };
}

function readTexts(elements: readonly Element[] | null): string[] {
  return (elements ?? []).map((element) => element.textContent ?? "");
}

describe("createSettingRow", () => {
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

  test("shows a description under the label and describes the control with it", () => {
    const { element, control } = setup({ description: "Thumbnails per row." });

    expect(element.querySelector(`.${SettingRowClass.description}`)?.textContent).toBe("Thumbnails per row.");
    expect(readTexts(control.ariaDescribedByElements)).toEqual(["Thumbnails per row."]);
  });

  test("has no description unless given one", () => {
    const { element, control } = setup();

    expect(element.querySelector(`.${SettingRowClass.description}`)).toBeNull();
    expect(control.ariaDescribedByElements ?? null).toBeNull();
  });

  test("is medium unless told otherwise", () => {
    expect(setup().element.dataset.size).toBe("medium");
    expect(setup({ size: "small" }).element.dataset.size).toBe("small");
  });

  test("hides and shows its description on request", () => {
    const { element, setDescriptionVisible } = setup({ description: "Thumbnails per row." });
    const description = element.querySelector<HTMLElement>(`.${SettingRowClass.description}`);

    setDescriptionVisible(false);
    expect(description?.hidden).toBe(true);
    setDescriptionVisible(true);
    expect(description?.hidden).toBe(false);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(SettingRowClass, SETTING_ROW_CSS);
  });
});
