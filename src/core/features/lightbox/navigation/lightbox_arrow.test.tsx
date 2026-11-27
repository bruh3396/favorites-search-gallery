import { Icon, createIcon } from "@/core/ui/components/icon/icon";
import { LightboxArrow, LightboxArrowClass } from "@/core/features/lightbox/navigation/lightbox_arrow";
import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import ARROW_CSS from "@/core/features/lightbox/navigation/lightbox_arrow.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css_utilities";

function drawnIconPath(icon: Icon): string | null {
  return render(document, () => createIcon(icon, "")).result.querySelector("path")!.getAttribute("d");
}

describe("LightboxArrow", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(LightboxArrowClass, ARROW_CSS);
  });

  test.each([
    ["previous", "chevronLeftLarge"],
    ["next", "chevronRightLarge"]
  ] as const)("draws the %s arrow's icon", (direction, icon) => {
    const { result: button } = render(document, () => <LightboxArrow direction={direction} label="Step" title="Step" onClick={vi.fn()} />);

    expect(button.querySelector("path")?.getAttribute("d")).toBe(drawnIconPath(icon));
  });

  test("labels itself and shows its title as it changes", () => {
    const title = new Signal("Show Next (→)");
    const { result: button } = render(document, () => <LightboxArrow direction="next" label="Show Next" title={title} onClick={vi.fn()} />);

    title.value = "Show Next (N)";
    expect([button.getAttribute("aria-label"), button.title]).toEqual(["Show Next", "Show Next (N)"]);
  });

  test("runs its action when clicked", () => {
    const onClick = vi.fn();
    const { result: button } = render(document, () => <LightboxArrow direction="next" label="Show Next" title="Show Next" onClick={onClick} />);

    button.click();
    expect(onClick).toHaveBeenCalledOnce();
  });
});
