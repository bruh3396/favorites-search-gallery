import { LightboxZoomChip, LightboxZoomChipClass } from "@/core/features/lightbox/zoom/lightbox_zoom_chip";
import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { Signal } from "@/core/utils/reactive/signal";
import ZOOM_CHIP_CSS from "@/core/features/lightbox/zoom/lightbox_zoom_chip.css?inline";
import { expectClassesStyled } from "@/testing/css_utilities";

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
});
