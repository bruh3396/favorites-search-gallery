import { LightboxArrow, LightboxArrowClass, LightboxArrowDirection } from "@/core/features/lightbox/ui/controls/arrow/arrow";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import ARROW_CSS from "@/core/features/lightbox/ui/controls/arrow/arrow.css?inline";
import { expectClassesStyled } from "@/testing/css";

function setup(direction: LightboxArrowDirection): { arrow: HTMLButtonElement; onClick: () => void } {
  const onClick = vi.fn<() => void>();
  const { result, dispose } = render(document, () => <LightboxArrow direction={direction} onClick={onClick} />);

  onTestFinished(dispose);
  return { arrow: result as HTMLButtonElement, onClick };
}

describe("LightboxArrow", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(LightboxArrowClass, ARROW_CSS);
  });

  test("labels itself by its direction", () => {
    expect([setup("previous").arrow, setup("next").arrow].map(arrow => [arrow.getAttribute("aria-label"), arrow.dataset.direction])).toEqual([
      ["Previous", "previous"],
      ["Next", "next"]
    ]);
  });

  test("calls back when clicked", () => {
    const { arrow, onClick } = setup("next");

    arrow.click();
    expect(onClick).toHaveBeenCalledOnce();
  });
});
