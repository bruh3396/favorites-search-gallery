import { Icon, createIcon } from "@/core/ui/components/icon/icon";
import { LightboxArrow, LightboxArrowClass } from "@/core/features/lightbox/navigation/lightbox_arrow";
import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import ARROW_CSS from "@/core/features/lightbox/navigation/lightbox_arrow.css?inline";
import { expectClassesStyled } from "@/testing/css_utilities";

function drawnIconPath(icon: Icon): string | null {
  return render(document, () => createIcon(icon, "")).result.querySelector("path")!.getAttribute("d");
}

describe("LightboxArrow", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(LightboxArrowClass, ARROW_CSS);
  });

  test.each([
    ["previous", "Previous", "chevronLeftLarge"],
    ["next", "Next", "chevronRightLarge"]
  ] as const)("labels the %s arrow and draws its icon", (direction, label, icon) => {
    const { result: button } = render(document, () => <LightboxArrow direction={direction} onClick={vi.fn()} />);

    expect([button.getAttribute("aria-label"), button.title]).toEqual([label, label]);
    expect(button.querySelector("path")?.getAttribute("d")).toBe(drawnIconPath(icon));
  });

  test("runs its action when clicked", () => {
    const onClick = vi.fn();
    const { result: button } = render(document, () => <LightboxArrow direction="next" onClick={onClick} />);

    button.click();
    expect(onClick).toHaveBeenCalledOnce();
  });
});
