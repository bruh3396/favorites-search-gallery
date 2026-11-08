import { LightboxArrow, LightboxArrowClass } from "@/core/features/lightbox/navigation/lightbox_arrow";
import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import ARROW_CSS from "@/core/features/lightbox/navigation/lightbox_arrow.css?inline";
import { LIGHTBOX_ICON_PATHS } from "@/core/features/lightbox/overlay/lightbox_icon";
import { expectClassesStyled } from "@/testing/css_utilities";

describe("LightboxArrow", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(LightboxArrowClass, ARROW_CSS);
  });

  test.each([["previous", "Previous"], ["next", "Next"]] as const)("labels the %s arrow and draws its icon", (direction, label) => {
    const { result: button } = render(document, () => <LightboxArrow direction={direction} onClick={vi.fn()} />);

    expect([button.getAttribute("aria-label"), button.title]).toEqual([label, label]);
    expect(button.querySelector("path")?.getAttribute("d")).toBe(LIGHTBOX_ICON_PATHS[direction]);
  });

  test("runs its action when clicked", () => {
    const onClick = vi.fn();
    const { result: button } = render(document, () => <LightboxArrow direction="next" onClick={onClick} />);

    button.click();
    expect(onClick).toHaveBeenCalledOnce();
  });
});
