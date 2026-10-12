import { LightboxPosition, LightboxPositionClass } from "@/core/features/lightbox/ui/controls/position/position";
import { describe, expect, onTestFinished, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import POSITION_CSS from "@/core/features/lightbox/ui/controls/position/position.css?inline";
import { SequencePosition } from "@/core/domain/media/media_sequence";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css";

function setup(initial: SequencePosition | undefined): { label: HTMLElement; position: Signal<SequencePosition | undefined> } {
  const position = new Signal(initial);
  const { result, dispose } = render(document, () => <LightboxPosition position={position} />);

  onTestFinished(dispose);
  return { label: result, position };
}

describe("LightboxPosition", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(LightboxPositionClass, POSITION_CSS);
  });

  test("shows the place counted from one, out of the total", () => {
    const { label } = setup({ index: 36, total: 1_204 });

    expect([label.hidden, label.textContent]).toEqual([false, `37 / ${(1_204).toLocaleString()}`]);
  });

  test("shows only the place when the total is unknown", () => {
    const { label } = setup({ index: 4, total: undefined });

    expect(label.textContent).toBe("5");
  });

  test("hides when the place is unknown", () => {
    const { label, position } = setup({ index: 0, total: 3 });

    position.value = undefined;
    expect(label.hidden).toBe(true);
  });
});
