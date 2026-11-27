import { LabCard, LabCardClass } from "@/targets/lab/components/card/lab_card";
import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import LAB_CARD_CSS from "@/targets/lab/components/card/lab_card.css?inline";
import { expectClassesStyled } from "@/testing/css_utilities";

describe("LabCard", () => {
  test("shows its children", () => {
    const row = document.createElement("div");
    const { result: element } = render(document, () => <LabCard>{row}</LabCard>);

    expect(element.contains(row)).toBe(true);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(LabCardClass, LAB_CARD_CSS);
  });
});
