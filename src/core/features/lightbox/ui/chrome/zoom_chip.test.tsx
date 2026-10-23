import { LightboxZoomChip, LightboxZoomChipClass } from "@/core/features/lightbox/ui/chrome/zoom_chip";
import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { Signal } from "@/core/utils/reactive/signal";
import ZOOM_CHIP_CSS from "@/core/features/lightbox/ui/chrome/zoom_chip.css?inline";
import { expectClassesStyled } from "@/testing/css";

function renderChip(pixelScale: number | undefined): HTMLElement {
  return render(document, () => <LightboxZoomChip pixelScale={new Signal(pixelScale)} />).result;
}

describe("LightboxZoomChip", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(LightboxZoomChipClass, ZOOM_CHIP_CSS);
  });

  test("hides while not zoomed", () => {
    const chip = renderChip(undefined);

    expect([chip.hidden, chip.textContent]).toEqual([true, ""]);
  });

  test("shows the scale as a rounded percent", () => {
    const chip = renderChip(2.504);

    expect([chip.hidden, chip.textContent]).toEqual([false, "250%"]);
  });

  test.each([1, 0.99, 1.01])("calls %s actual pixels", pixelScale => {
    expect(renderChip(pixelScale).textContent).toBe(`${Math.round(pixelScale * 100)}% · actual pixels`);
  });

  test("stops calling it actual pixels outside the tolerance", () => {
    expect(renderChip(1.02).textContent).toBe("102%");
  });
});
