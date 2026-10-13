import { LightboxZoomChip, LightboxZoomChipClass } from "@/core/features/lightbox/ui/zoom_chip/zoom_chip";
import { describe, expect, onTestFinished, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { Signal } from "@/core/utils/reactive/signal";
import ZOOM_CHIP_CSS from "@/core/features/lightbox/ui/zoom_chip/zoom_chip.css?inline";
import { expectClassesStyled } from "@/testing/css";

function setup(initial: number | undefined): { chip: HTMLElement; magnification: Signal<number | undefined> } {
  const magnification = new Signal(initial);
  const { result, dispose } = render(document, () => <LightboxZoomChip magnification={magnification} />);

  onTestFinished(dispose);
  return { chip: result, magnification };
}

describe("LightboxZoomChip", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(LightboxZoomChipClass, ZOOM_CHIP_CSS);
  });

  test("shows the magnification as a whole percentage", () => {
    const { chip } = setup(2.504);

    expect([chip.hidden, chip.textContent]).toEqual([false, "250%"]);
  });

  test("says when it shows about actual pixels", () => {
    const { chip } = setup(0.996);

    expect(chip.textContent).toBe("100% · actual pixels");
  });

  test("hides while fitted", () => {
    const { chip, magnification } = setup(2);

    magnification.value = undefined;
    expect([chip.hidden, chip.textContent]).toEqual([true, ""]);
  });
});
