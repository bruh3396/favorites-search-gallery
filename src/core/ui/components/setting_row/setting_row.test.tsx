import { SettingRow, SettingRowClass, SettingRowProps } from "@/core/ui/components/setting_row/setting_row";
import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import SETTING_ROW_CSS from "@/core/ui/components/setting_row/setting_row.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css";

interface Setup {
  element: HTMLElement;
  dispose: () => void;
  control: HTMLElement;
}

function setup(props: Partial<SettingRowProps> = {}): Setup {
  const control = props.control ?? document.createElement("button");
  const { result: element, dispose } = render(document, () => <SettingRow label="Columns" {...props} control={control} />);
  return { element, dispose, control };
}

function readTexts(elements: readonly Element[] | null): string[] {
  return (elements ?? []).map(element => element.textContent ?? "");
}

function findDescription(element: HTMLElement): HTMLElement | null {
  return element.querySelector<HTMLElement>(`.${SettingRowClass.description}`);
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

  test("shows a description under the label and describes the control with it", () => {
    const { element, control } = setup({ description: "Thumbnails per row." });

    expect(findDescription(element)?.textContent).toBe("Thumbnails per row.");
    expect(findDescription(element)?.hidden).toBe(false);
    expect(readTexts(control.ariaDescribedByElements)).toEqual(["Thumbnails per row."]);
  });

  test("has no description unless given one", () => {
    const { element, control } = setup();

    expect(findDescription(element)).toBeNull();
    expect(control.ariaDescribedByElements ?? null).toBeNull();
  });

  test("is medium unless told otherwise", () => {
    expect(setup().element.dataset.size).toBe("medium");
    expect(setup({ size: "small" }).element.dataset.size).toBe("small");
  });

  test("hides and shows its description as told", () => {
    const descriptionVisible = new Signal(false);
    const { element } = setup({ description: "Thumbnails per row.", descriptionVisible });

    expect(findDescription(element)?.hidden).toBe(true);
    descriptionVisible.value = true;
    expect(findDescription(element)?.hidden).toBe(false);
  });

  test("stops following whether its description is visible once disposed", () => {
    const descriptionVisible = new Signal(true);
    const { element, dispose } = setup({ description: "Thumbnails per row.", descriptionVisible });

    dispose();
    descriptionVisible.value = false;
    expect(findDescription(element)?.hidden).toBe(false);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(SettingRowClass, SETTING_ROW_CSS);
  });
});
