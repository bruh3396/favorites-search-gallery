import { LabRow, LabRowClass, LabRowProps } from "@/targets/lab/components/row/lab_row";
import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import LAB_ROW_CSS from "@/targets/lab/components/row/lab_row.css?inline";
import { expectClassesStyled } from "@/testing/css_utilities";

function setup(partialLabRowProps: Partial<LabRowProps> = {}): HTMLElement {
  return render(document, () => <LabRow name="Lab" actionsChild={document.createElement("button")} {...partialLabRowProps} />).result;
}

function readTexts(elements: readonly Element[] | null): string[] {
  return (elements ?? []).map(element => element.textContent ?? "");
}

describe("LabRow", () => {
  test("shows its name, controls and actions", () => {
    const controlsChild = document.createElement("input");
    const actionsChild = document.createElement("button");
    const element = setup({ name: "Main", controlsChild, actionsChild });

    expect([element.textContent, element.contains(controlsChild), element.contains(actionsChild)]).toEqual(["Main", true, true]);
  });

  test("shows its progress when given one", () => {
    const progressChild = document.createElement("div");

    expect(setup({ progressChild }).contains(progressChild)).toBe(true);
  });

  test("names its group after its name, by reference rather than id", () => {
    const element = setup({ name: "Site" });

    expect([element.getAttribute("role"), readTexts(element.ariaLabelledByElements)]).toEqual(["group", ["Site"]]);
    expect(element.querySelector("[id]")).toBeNull();
  });

  test("styles every class it sets", () => {
    expectClassesStyled(LabRowClass, LAB_ROW_CSS);
  });
});
